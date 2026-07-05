import { createMoMoTransferRecipient, initiateTransfer } from "@/server/paystack-transfers";

const DRIVER_PAYOUT_PCT = 0.75;
const FARMER_PAYOUT_PCT = 0.94;

export async function processOrderPayouts(orderId: string): Promise<{ ok: boolean; message: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("*, delivery:deliveries(*, driver:driver_profiles(*))")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return { ok: false, message: "Order not found" };
  if (order.payouts_processed) return { ok: true, message: "Already paid out" };
  if (order.payment_status !== "paid") return { ok: false, message: "Order not paid" };

  const { data: cfg } = await supabaseAdmin
    .from("delivery_pricing_config")
    .select("driver_payout_pct, farmer_payout_pct, platform_fee_pct")
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  const driverPct = Number(cfg?.driver_payout_pct ?? DRIVER_PAYOUT_PCT);
  const farmerPct = Number(cfg?.farmer_payout_pct ?? FARMER_PAYOUT_PCT);

  const { data: items } = await supabaseAdmin.from("order_items").select("*").eq("order_id", orderId);

  const delivery = order.delivery as {
    id: string;
    delivery_fee: number | null;
    driver: { user_id: string; momo_number: string | null; plate_number: string | null } | null;
  } | null;

  const payouts: { userId: string; amount: number; role: "farmer" | "driver"; momo: string; name: string }[] = [];

  for (const item of items ?? []) {
    const sellerId = item.seller_id as string;
    const amount = Math.round(Number(item.total_price) * farmerPct * 100) / 100;
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("display_name, phone")
      .eq("id", sellerId)
      .maybeSingle();
    const { data: existing } = await supabaseAdmin
      .from("payouts")
      .select("id")
      .eq("order_id", orderId)
      .eq("user_id", sellerId)
      .eq("role_context", "farmer")
      .maybeSingle();
    if (!existing && amount > 0) {
      payouts.push({
        userId: sellerId,
        amount,
        role: "farmer",
        momo: profile?.phone ?? "",
        name: profile?.display_name ?? "Farmer",
      });
    }
  }

  if (delivery?.driver && delivery.delivery_fee) {
    const driverAmount = Math.round(Number(delivery.delivery_fee) * driverPct * 100) / 100;
    const { data: existing } = await supabaseAdmin
      .from("payouts")
      .select("id")
      .eq("delivery_id", delivery.id)
      .eq("role_context", "driver")
      .maybeSingle();
    if (!existing && driverAmount > 0) {
      payouts.push({
        userId: delivery.driver.user_id,
        amount: driverAmount,
        role: "driver",
        momo: delivery.driver.momo_number ?? "",
        name: `Driver ${delivery.driver.plate_number ?? ""}`.trim(),
      });
    }
  }

  for (const p of payouts) {
    const ref = `agrolink-payout-${orderId.slice(0, 8)}-${p.role}-${p.userId.slice(0, 6)}`;
    const { data: row } = await supabaseAdmin
      .from("payouts")
      .insert({
        user_id: p.userId,
        amount: p.amount,
        status: "processing",
        role_context: p.role,
        order_id: p.role === "farmer" ? orderId : null,
        delivery_id: p.role === "driver" ? delivery?.id : null,
        momo_number: p.momo,
      })
      .select("id")
      .single();

    if (p.momo) {
      const recipient = await createMoMoTransferRecipient({
        name: p.name,
        phone: p.momo,
        provider: "mtn",
      });
      if (recipient) {
        const transfer = await initiateTransfer({
          amountGhs: p.amount,
          recipientCode: recipient.recipientCode,
          reason: `AgroLink ${p.role} payout`,
          reference: ref,
        });
        await supabaseAdmin
          .from("payouts")
          .update({
            status: transfer.ok ? "paid" : "failed",
            provider_reference: transfer.reference,
            updated_at: new Date().toISOString(),
          })
          .eq("id", row?.id);
      } else {
        await supabaseAdmin
          .from("payouts")
          .update({ status: "pending", updated_at: new Date().toISOString() })
          .eq("id", row?.id);
      }
    }
  }

  await supabaseAdmin
    .from("orders")
    .update({ payouts_processed: true, status: "delivered", updated_at: new Date().toISOString() })
    .eq("id", orderId);

  await supabaseAdmin.from("audit_log").insert({
    action: "payouts_processed",
    entity_type: "order",
    entity_id: orderId,
    metadata: { payout_count: payouts.length },
  });

  return { ok: true, message: `Processed ${payouts.length} payout(s)` };
}
