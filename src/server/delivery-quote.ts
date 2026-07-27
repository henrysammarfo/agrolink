import {
  calculateDeliveryQuote,
  calculatePlatformFee,
  DEFAULT_PRICING,
  type PricingConfig,
  type VehicleType,
} from "@/lib/delivery-pricing";
import { fetchDrivingDistanceKm } from "@/server/mapbox";

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
  pickupStops?: { lat: number; lng: number; label?: string }[];
}) {
  const to = { lat: params.deliveryLat, lng: params.deliveryLng };
  let distanceKm: number;
  let routingSource: "mapbox" | "osrm" | "haversine" = "haversine";
  let orderedStops: { lat: number; lng: number; label?: string }[] | undefined;

  if (params.pickupStops && params.pickupStops.length > 1) {
    const { computeMultiStopDistanceKm } = await import("@/server/batch-routing");
    const batch = await computeMultiStopDistanceKm(params.pickupStops, to);
    distanceKm = batch.distanceKm;
    orderedStops = batch.orderedStops;
    routingSource = batch.routingSource;
  } else {
    const from = { lat: params.pickupLat, lng: params.pickupLng };
    const routed = await fetchDrivingDistanceKm(from, to);
    distanceKm = routed.distanceKm;
    routingSource = routed.source;
  }
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
  return { ...quote, distanceKm, platformFee, pricingConfig: cfg, orderedStops, routingSource };
}
