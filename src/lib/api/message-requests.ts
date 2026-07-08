import { supabase } from "@/integrations/supabase/client";
import { apiFetch } from "@/lib/api/fetch-auth";

export type MessageRequestRow = {
  requester_id: string;
  preview: string | null;
  created_at: string;
  requester?: {
    display_name: string | null;
    avatar_url: string | null;
    slug: string | null;
  };
};

export async function fetchMessageRequests(userId: string): Promise<MessageRequestRow[]> {
  const { data, error } = await supabase
    .from("message_requests")
    .select(
      "requester_id, preview, created_at, requester:profiles!message_requests_requester_id_fkey(display_name, avatar_url, slug)",
    )
    .eq("recipient_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MessageRequestRow[];
}

export async function respondToMessageRequest(
  action: "accept" | "decline" | "block",
  requesterId: string,
) {
  const res = await apiFetch("/api/chat/request", {
    method: "POST",
    body: JSON.stringify({ action, requesterId }),
  });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Action failed");
}

export async function fetchRequestStatus(requesterId: string, recipientId: string) {
  const { data } = await supabase
    .from("message_requests")
    .select("status")
    .eq("requester_id", requesterId)
    .eq("recipient_id", recipientId)
    .maybeSingle();
  return data?.status ?? null;
}
