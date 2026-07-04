import { supabase } from "@/integrations/supabase/client";
import type { NotificationRow, MessageRow } from "@/lib/types/marketplace";

export async function fetchNotifications(userId: string): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as NotificationRow[];
}

export async function markNotificationRead(id: string) {
  await supabase.from("notifications").update({ read: true }).eq("id", id);
}

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body?: string,
  link?: string,
) {
  await supabase.from("notifications").insert({ user_id: userId, type, title, body, link });
}

export async function fetchMessages(userId: string): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*, sender:profiles!messages_sender_id_fkey(display_name)")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as MessageRow[];
}

export async function sendMessage(
  senderId: string,
  receiverId: string,
  content: string,
  orderId?: string,
) {
  const { error } = await supabase.from("messages").insert({
    sender_id: senderId,
    receiver_id: receiverId,
    content,
    order_id: orderId ?? null,
  });
  if (error) throw error;
}

export async function updateProfile(userId: string, updates: Record<string, unknown>) {
  const { error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;
}

export async function fetchAdminStats() {
  const [orders, payments, listings, disputes] = await Promise.all([
    supabase.from("orders").select("total_amount, status"),
    supabase.from("payments").select("amount, status").eq("status", "paid"),
    supabase.from("listings").select("id, status"),
    supabase.from("listings").select("id").eq("status", "pending_review"),
  ]);

  const gmv = (payments.data ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const orderCount = orders.data?.length ?? 0;
  const activeListings = (listings.data ?? []).filter((l) => l.status === "active").length;
  const pendingReview = disputes.data?.length ?? 0;

  return { gmv, orderCount, activeListings, pendingReview };
}

export async function submitContactForm(name: string, email: string, message: string) {
  await supabase.from("audit_log").insert({
    action: "contact_form",
    entity_type: "contact",
    metadata: { name, email, message },
  });
}
