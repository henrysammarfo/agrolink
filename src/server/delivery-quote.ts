import {
  calculateDeliveryQuote,
  calculatePlatformFee,
  DEFAULT_PRICING,
  type PricingConfig,
  type VehicleType,
} from "@/lib/delivery-pricing";

async function fetchOsrmDistanceKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<number | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
    const res = await fetch(url);
    const json = (await res.json()) as { routes?: { distance: number }[] };
    const route = json.routes?.[0];
    if (!route) return null;
    return route.distance / 1000;
  } catch {
    return null;
  }
}

function haversineKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function getActivePricingConfig(): Promise<PricingConfig> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("delivery_pricing_config")
      .select("*")
      .eq("active", true)
      .limit(1)
      .maybeSingle();
    if (!data) return DEFAULT_PRICING;
    return {
      base_fare: Number(data.base_fare),
      per_km_rate: Number(data.per_km_rate),
      per_kg_rate: Number(data.per_kg_rate),
      free_kg: Number(data.free_kg),
      min_fare: Number(data.min_fare),
      platform_fee_pct: Number(data.platform_fee_pct),
      peak_multiplier: Number(data.peak_multiplier),
      surge_multiplier: data.surge_active ? Number(data.surge_multiplier ?? 1) : 1,
      motorcycle_multiplier: Number(data.motorcycle_multiplier),
      pickup_multiplier: Number(data.pickup_multiplier),
      truck_multiplier: Number(data.truck_multiplier),
    };
  } catch {
    return DEFAULT_PRICING;
  }
}

export async function computeDeliveryQuote(params: {
  pickupLat: number;
  pickupLng: number;
  deliveryLat: number;
  deliveryLng: number;
  weightKg: number;
  vehicleType?: VehicleType;
}) {
  const from = { lat: params.pickupLat, lng: params.pickupLng };
  const to = { lat: params.deliveryLat, lng: params.deliveryLng };
  const osrmKm = await fetchOsrmDistanceKm(from, to);
  const distanceKm = osrmKm ?? haversineKm(from, to);
  const cfg = await getActivePricingConfig();
  const surgeMult = cfg.surge_multiplier > 1 ? cfg.surge_multiplier : undefined;
  const quote = calculateDeliveryQuote(
    {
      distanceKm,
      weightKg: params.weightKg,
      vehicleType: params.vehicleType ?? "motorcycle",
      surgeMultiplier: surgeMult,
    },
    cfg,
  );
  const platformFee = calculatePlatformFee(params.weightKg > 0 ? quote.total : quote.total, cfg);
  return { ...quote, distanceKm, platformFee, pricingConfig: cfg };
}
