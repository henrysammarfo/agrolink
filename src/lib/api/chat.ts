import { supabase } from "@/integrations/supabase/client";
import type { MessageRow } from "@/lib/types/marketplace";
import { apiFetch } from "@/lib/api/fetch-auth";

export type Conversation = {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  lastMessage: string;
  lastAt: string;
  unread: number;
  orderId?: string;
};

export async function fetchConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("messages")
    .select(
      "id, sender_id, receiver_id, content, read, created_at, order_id, attachment_url, sender:profiles!messages_sender_id_fkey(display_name, avatar_url), receiver:profiles!messages_receiver_id_fkey(display_name, avatar_url)",
    )
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;

  const map = new Map<string, Conversation>();
  for (const row of data ?? []) {
    const partnerId = row.sender_id === userId ? row.receiver_id : row.sender_id;
    if (map.has(partnerId)) continue;

    const partner =
      row.sender_id === userId
        ? (row.receiver as unknown as { display_name: string | null; avatar_url: string | null })
        : (row.sender as unknown as { display_name: string | null; avatar_url: string | null });

    const unread = (data ?? []).filter(
      (m) => m.receiver_id === userId && m.sender_id === partnerId && !m.read,
    ).length;

    map.set(partnerId, {
      partnerId,
      partnerName: partner?.display_name ?? "User",
      partnerAvatar: partner?.avatar_url ?? null,
      lastMessage: row.content || (row.attachment_url ? "📷 Photo" : ""),
      lastAt: row.created_at,
      unread,
      orderId: row.order_id ?? undefined,
    });
  }

  return Array.from(map.values());
}

export async function fetchThreadMessages(
  userId: string,
  partnerId: string,
  limit = 100,
): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*, sender:profiles!messages_sender_id_fkey(display_name, avatar_url)")
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`,
    )
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as MessageRow[];
}

export async function sendChatMessage(opts: {
  senderId: string;
  receiverId: string;
  content: string;
  orderId?: string;
  deliveryId?: string;
  senderName?: string;
  attachmentUrl?: string;
  attachmentType?: "image" | "video" | "audio";
}): Promise<string | "pending"> {
  const res = await apiFetch("/api/chat/send", {
    method: "POST",
    body: JSON.stringify({
      receiverId: opts.receiverId,
      content: opts.content,
      orderId: opts.orderId,
      deliveryId: opts.deliveryId,
      senderName: opts.senderName,
      attachmentUrl: opts.attachmentUrl,
      attachmentType: opts.attachmentType,
    }),
  });
  const data = (await res.json()) as { id?: string; pending?: boolean; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Send failed");
  if (data.pending) return "pending";
  return data.id!;
}

export async function markThreadRead(userId: string, partnerId: string) {
  await supabase
    .from("messages")
    .update({ read: true })
    .eq("receiver_id", userId)
    .eq("sender_id", partnerId)
    .eq("read", false);
}

export async function fetchUnreadMessageCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("receiver_id", userId)
    .eq("read", false);
  if (error) return 0;
  return count ?? 0;
}

export function subscribeToMessages(
  userId: string,
  onMessage: (msg: MessageRow) => void,
) {
  const channel = supabase
    .channel(`messages:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `receiver_id=eq.${userId}`,
      },
      async (payload) => {
        const row = payload.new as MessageRow;
        const { data: sender } = await supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("id", row.sender_id)
          .maybeSingle();
        onMessage({ ...row, sender: sender ?? undefined });
      },
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `sender_id=eq.${userId}`,
      },
      async (payload) => {
        const row = payload.new as MessageRow;
        const { data: sender } = await supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("id", row.sender_id)
          .maybeSingle();
        onMessage({ ...row, sender: sender ?? undefined });
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
