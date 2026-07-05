import { supabase } from "@/integrations/supabase/client";

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
  const { data, error } = await supabase
    .from("payments")
    .select(
      "*, order:orders(id, buyer_id, total_amount, status, items:order_items(seller_id, listing:listings(title)))",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as AdminPaymentRow[];
}

export async function updatePaymentStatus(paymentId: string, status: string, note?: string) {
  const { error } = await supabase
    .from("payments")
    .update({
      status,
      updated_at: new Date().toISOString(),
      metadata: note ? { admin_note: note } : undefined,
    })
    .eq("id", paymentId);
  if (error) throw error;
}
