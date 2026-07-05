import { JOB_ACCEPT_SECONDS } from "@/lib/delivery-constants";

export { JOB_ACCEPT_SECONDS };

export function acceptDeadlineFromNow(): string {
  return new Date(Date.now() + JOB_ACCEPT_SECONDS * 1000).toISOString();
}

/** Reassign deliveries whose accept window expired without a driver (Bolt pattern) */
export async function reassignExpiredDeliveries(): Promise<{ reassigned: number }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const now = new Date().toISOString();

  const { data: expired } = await supabaseAdmin
    .from("deliveries")
    .select("id, pickup_address, delivery_fee, offer_round, order_id")
    .eq("status", "requested")
    .is("driver_id", null)
    .not("accept_deadline", "is", null)
    .lt("accept_deadline", now);

  if (!expired?.length) return { reassigned: 0 };

  const { notifyDriversOfNewJob } = await import("@/server/push");
  let count = 0;

  for (const d of expired) {
    if ((d.offer_round ?? 1) >= 5) continue;

    await supabaseAdmin
      .from("deliveries")
      .update({
        accept_deadline: acceptDeadlineFromNow(),
        offer_round: (d.offer_round ?? 1) + 1,
        updated_at: now,
      })
      .eq("id", d.id);

    await notifyDriversOfNewJob(
      d.id,
      d.pickup_address,
      Number(d.delivery_fee ?? 0),
    );
    count++;
  }

  return { reassigned: count };
}

export async function setDeliveryAcceptDeadline(deliveryId: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("deliveries")
    .update({
      accept_deadline: acceptDeadlineFromNow(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", deliveryId);
}
