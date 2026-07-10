import { apiFetch } from "@/lib/api/fetch-auth";
import { supabase } from "@/integrations/supabase/client";

export async function fetchDriverEarnings(userId: string, days = 7) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data: profile } = await supabase
    .from("driver_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!profile?.id) return { today: 0, week: 0, trips: 0, series: [] as { day: string; ghs: number }[] };

  const { data } = await supabase
    .from("deliveries")
    .select("delivery_fee, status, updated_at")
    .eq("driver_id", profile.id)
    .eq("status", "delivered")
    .gte("updated_at", since);

  const delivered = data ?? [];
  const todayStr = new Date().toLocaleDateString("en-GH");
  const today = delivered
    .filter((d) => new Date(d.updated_at).toLocaleDateString("en-GH") === todayStr)
    .reduce((s, d) => s + Number(d.delivery_fee ?? 0), 0);
  const week = delivered.reduce((s, d) => s + Number(d.delivery_fee ?? 0), 0);

  const byDay = new Map<string, number>();
  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(Date.now() - d * 86400000);
    byDay.set(date.toLocaleDateString("en-GH", { weekday: "short" }), 0);
  }
  for (const row of delivered) {
    const day = new Date(row.updated_at).toLocaleDateString("en-GH", { weekday: "short" });
    byDay.set(day, (byDay.get(day) ?? 0) + Number(row.delivery_fee ?? 0));
  }

  return {
    today,
    week,
    trips: delivered.length,
    series: Array.from(byDay.entries()).map(([day, ghs]) => ({ day, ghs })),
  };
}

export async function fetchUserPayouts(userId: string) {
  const { data, error } = await supabase
    .from("payouts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchFarmerRevenue(userId: string, days = 7) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data } = await supabase
    .from("order_items")
    .select("total_price, created_at, order:orders!inner(payment_status, status)")
    .eq("seller_id", userId)
    .gte("created_at", since);

  const paid = (data ?? []).filter((i) => {
    const o = i.order as { payment_status: string };
    return o.payment_status === "paid";
  });

  const byDay = new Map<string, number>();
  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(Date.now() - d * 86400000);
    byDay.set(date.toLocaleDateString("en-GH", { weekday: "short" }), 0);
  }
  for (const item of paid) {
    const day = new Date(item.created_at).toLocaleDateString("en-GH", { weekday: "short" });
    byDay.set(day, (byDay.get(day) ?? 0) + Number(item.total_price));
  }

  return {
    series: Array.from(byDay.entries()).map(([day, ghs]) => ({ day, ghs })),
    total: paid.reduce((s, i) => s + Number(i.total_price), 0),
    pendingOrders: (data ?? []).length - paid.length,
  };
}

export type AdminPaymentRow = {
  id: string;
  amount: number;
  status: string;
  provider_reference: string | null;
  idempotency_key: string | null;
  created_at: string;
  order?: {
    id: string;
    buyer_id: string;
    total_amount: number;
    status: string;
    items?: { seller_id: string; listing?: { title: string } }[];
  };
};

export async function fetchAdminPayments(): Promise<AdminPaymentRow[]> {
  const res = await apiFetch("/api/admin/payments");
  const json = (await res.json()) as { payments?: AdminPaymentRow[]; error?: string };
  if (!res.ok) throw new Error(json.error ?? "Failed to load payments");
  return json.payments ?? [];
}

export async function updatePaymentStatus(paymentId: string, status: string, note?: string) {
  const res = await apiFetch("/api/admin/payments", {
    method: "PATCH",
    body: JSON.stringify({ paymentId, status, note }),
  });
  const json = (await res.json()) as { error?: string };
  if (!res.ok) throw new Error(json.error ?? "Failed to update payment");
}
