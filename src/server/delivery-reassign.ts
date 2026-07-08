import { JOB_ACCEPT_SECONDS } from "@/lib/delivery-constants";
import { radiusForOfferRound } from "@/lib/vehicle-types";

export { JOB_ACCEPT_SECONDS };

export function acceptDeadlineFromNow(): string {
  return new Date(Date.now() + JOB_ACCEPT_SECONDS * 1000).toISOString();
}

/** Reassign deliveries whose accept window expired — expand radius each round */
export async function reassignExpiredDeliveries(): Promise<{ reassigned: number }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { notifyEligibleDriversForDelivery } = await import("@/server/driver-matching");
  const now = new Date().toISOString();

  const { data: expired } = await supabaseAdmin
    .from("deliveries")
    .select("id, pickup_address, delivery_fee, offer_round, order_id")
    .eq("status", "requested")
    .is("driver_id", null)
    .not("accept_deadline", "is", null)
    .lt("accept_deadline", now);

  if (!expired?.length) return { reassigned: 0 };

  let count = 0;

  for (const d of expired) {
    if ((d.offer_round ?? 1) >= 5) continue;

    const nextRound = (d.offer_round ?? 1) + 1;
    const nextRadius = radiusForOfferRound(nextRound);

    await supabaseAdmin
      .from("deliveries")
      .update({
        accept_deadline: acceptDeadlineFromNow(),
        offer_round: nextRound,
        search_radius_km: nextRadius,
        updated_at: now,
      })
      .eq("id", d.id);

    await notifyEligibleDriversForDelivery(d.id);
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
      search_radius_km: radiusForOfferRound(1),
      offer_round: 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", deliveryId);
}
