import {
  haversineKm,
  radiusForOfferRound,
  vehicleCanFulfill,
  type VehicleFilter,
} from "@/lib/vehicle-types";

export type EligibleDriver = {
  id: string;
  user_id: string;
  vehicle_type: string;
  current_lat: number;
  current_lng: number;
  distance_km: number;
};

export async function findEligibleDrivers(opts: {
  pickupLat: number;
  pickupLng: number;
  requiredVehicleType?: string | null;
  radiusKm: number;
  declinedDriverIds?: string[];
  vehicleFilter?: VehicleFilter;
}): Promise<EligibleDriver[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const declined = new Set(opts.declinedDriverIds ?? []);

  const { data: drivers } = await supabaseAdmin
    .from("driver_profiles")
    .select("id, user_id, vehicle_type, current_lat, current_lng")
    .eq("verification_status", "approved")
    .eq("available", true)
    .not("current_lat", "is", null)
    .not("current_lng", "is", null);

  const pickup = { lat: opts.pickupLat, lng: opts.pickupLng };
  const eligible: EligibleDriver[] = [];

  for (const d of drivers ?? []) {
    if (declined.has(d.id)) continue;
    if (!vehicleCanFulfill(d.vehicle_type, opts.requiredVehicleType)) continue;
    if (
      opts.vehicleFilter &&
      opts.vehicleFilter !== "all" &&
      !vehicleCanFulfill(d.vehicle_type, opts.vehicleFilter)
    ) {
      continue;
    }
    const distance_km = haversineKm(pickup, {
      lat: d.current_lat as number,
      lng: d.current_lng as number,
    });
    if (distance_km > opts.radiusKm) continue;
    eligible.push({
      id: d.id,
      user_id: d.user_id,
      vehicle_type: d.vehicle_type,
      current_lat: d.current_lat as number,
      current_lng: d.current_lng as number,
      distance_km,
    });
  }

  return eligible.sort((a, b) => a.distance_km - b.distance_km);
}

export async function notifyEligibleDriversForDelivery(deliveryId: string): Promise<number> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { notifyUser } = await import("@/server/comms");

  const { data: delivery } = await supabaseAdmin
    .from("deliveries")
    .select(
      "id, pickup_lat, pickup_lng, pickup_address, delivery_fee, offer_round, required_vehicle_type, search_radius_km, declined_driver_ids",
    )
    .eq("id", deliveryId)
    .maybeSingle();

  if (!delivery || delivery.pickup_lat == null || delivery.pickup_lng == null) return 0;

  const round = delivery.offer_round ?? 1;
  const radiusKm = Number(delivery.search_radius_km ?? radiusForOfferRound(round));
  const drivers = await findEligibleDrivers({
    pickupLat: delivery.pickup_lat,
    pickupLng: delivery.pickup_lng,
    requiredVehicleType: delivery.required_vehicle_type,
    radiusKm,
    declinedDriverIds: (delivery.declined_driver_ids ?? []) as string[],
  });

  const feeGhs = Number(delivery.delivery_fee ?? 0);
  const title = `Delivery job · ${radiusKm}km radius`;
  const body = `${delivery.pickup_address} · GHS ${feeGhs.toFixed(0)} — tap to accept`;

  for (const d of drivers) {
    await notifyUser(d.user_id, {
      type: "delivery_job",
      title,
      body,
      link: "/app/transport",
      whatsappExtras: { pickup: delivery.pickup_address ?? "", fee: String(feeGhs.toFixed(0)) },
    });
  }

  await supabaseAdmin.from("audit_log").insert({
    action: "driver_job_targeted",
    entity_type: "delivery",
    entity_id: deliveryId,
    metadata: { driver_count: drivers.length, radius_km: radiusKm, offer_round: round },
  });

  return drivers.length;
}

export async function acceptDeliveryServer(
  deliveryId: string,
  driverProfileId: string,
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: driver } = await supabaseAdmin
    .from("driver_profiles")
    .select("id, user_id, available, verification_status, vehicle_type")
    .eq("id", driverProfileId)
    .maybeSingle();

  if (!driver || driver.user_id !== userId) {
    return { ok: false, error: "Driver profile not found" };
  }
  if (driver.verification_status !== "approved") {
    return { ok: false, error: "Driver not verified" };
  }
  if (!driver.available) {
    return { ok: false, error: "Go online to accept jobs" };
  }

  const { data: delivery } = await supabaseAdmin
    .from("deliveries")
    .select("id, status, driver_id, required_vehicle_type, pickup_lat, pickup_lng, search_radius_km, declined_driver_ids")
    .eq("id", deliveryId)
    .maybeSingle();

  if (!delivery || delivery.status !== "requested" || delivery.driver_id) {
    return { ok: false, error: "Job no longer available" };
  }

  if (!vehicleCanFulfill(driver.vehicle_type, delivery.required_vehicle_type)) {
    return { ok: false, error: "Your vehicle type cannot take this job" };
  }

  if (delivery.pickup_lat != null && delivery.pickup_lng != null) {
    const { data: loc } = await supabaseAdmin
      .from("driver_profiles")
      .select("current_lat, current_lng")
      .eq("id", driverProfileId)
      .maybeSingle();
    if (loc?.current_lat != null && loc?.current_lng != null) {
      const dist = haversineKm(
        { lat: delivery.pickup_lat, lng: delivery.pickup_lng },
        { lat: loc.current_lat, lng: loc.current_lng },
      );
      const maxRadius = Number(delivery.search_radius_km ?? 500);
      if (dist > maxRadius) {
        return { ok: false, error: `Pickup is ${dist.toFixed(0)}km away (max ${maxRadius}km)` };
      }
    }
  }

  const { data: updated, error } = await supabaseAdmin
    .from("deliveries")
    .update({
      driver_id: driverProfileId,
      status: "driver_assigned",
      accept_deadline: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", deliveryId)
    .eq("status", "requested")
    .is("driver_id", null)
    .select("id, order_id")
    .maybeSingle();

  if (error || !updated) {
    return { ok: false, error: "Another driver accepted this job" };
  }

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("buyer_id")
    .eq("id", updated.order_id)
    .maybeSingle();

  if (order?.buyer_id) {
    const { notifyUser } = await import("@/server/comms");
    await notifyUser(order.buyer_id, {
      type: "delivery",
      title: "Driver assigned",
      body: "Your driver is on the way to pick up your produce.",
      link: `/app/buyer/orders/${updated.order_id}/track`,
    });
  }

  return { ok: true };
}

export async function declineDeliveryServer(
  deliveryId: string,
  driverProfileId: string,
  userId: string,
): Promise<{ ok: boolean }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: driver } = await supabaseAdmin
    .from("driver_profiles")
    .select("id, user_id")
    .eq("id", driverProfileId)
    .maybeSingle();
  if (!driver || driver.user_id !== userId) return { ok: false };

  const { data: delivery } = await supabaseAdmin
    .from("deliveries")
    .select("declined_driver_ids")
    .eq("id", deliveryId)
    .eq("status", "requested")
    .maybeSingle();
  if (!delivery) return { ok: false };

  const declined = [...new Set([...(delivery.declined_driver_ids ?? []), driverProfileId])];
  await supabaseAdmin
    .from("deliveries")
    .update({ declined_driver_ids: declined, updated_at: new Date().toISOString() })
    .eq("id", deliveryId);

  return { ok: true };
}
