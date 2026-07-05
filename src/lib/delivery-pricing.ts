/**
 * Bolt/Uber-style delivery fee calculator for Ghana produce logistics.
 * Factors: base fare, distance, weight, vehicle type, peak hours, minimum fare.
 */

export type VehicleType = "motorcycle" | "pickup" | "truck" | "minivan";

export type PricingConfig = {
  base_fare: number;
  per_km_rate: number;
  per_kg_rate: number;
  free_kg: number;
  min_fare: number;
  platform_fee_pct: number;
  peak_multiplier: number;
  motorcycle_multiplier: number;
  pickup_multiplier: number;
  truck_multiplier: number;
};

export const DEFAULT_PRICING: PricingConfig = {
  base_fare: 15,
  per_km_rate: 2.5,
  per_kg_rate: 0.5,
  free_kg: 20,
  min_fare: 25,
  platform_fee_pct: 0.06,
  peak_multiplier: 1.2,
  motorcycle_multiplier: 1.0,
  pickup_multiplier: 1.4,
  truck_multiplier: 1.8,
};

export type DeliveryQuoteInput = {
  distanceKm: number;
  weightKg: number;
  vehicleType?: VehicleType;
  at?: Date;
};

export type DeliveryQuote = {
  baseFare: number;
  distanceCharge: number;
  weightCharge: number;
  vehicleMultiplier: number;
  peakMultiplier: number;
  subtotal: number;
  total: number;
  breakdown: string[];
};

function vehicleMultiplier(type: VehicleType, cfg: PricingConfig): number {
  switch (type) {
    case "pickup":
    case "minivan":
      return cfg.pickup_multiplier;
    case "truck":
      return cfg.truck_multiplier;
    default:
      return cfg.motorcycle_multiplier;
  }
}

/** Peak: weekday 7–9am and 5–8pm Accra local (UTC+0) */
export function isPeakHour(at: Date = new Date()): boolean {
  const h = at.getUTCHours();
  const day = at.getUTCDay();
  if (day === 0) return false;
  return (h >= 7 && h < 9) || (h >= 17 && h < 20);
}

export function calculateDeliveryQuote(
  input: DeliveryQuoteInput,
  cfg: PricingConfig = DEFAULT_PRICING,
): DeliveryQuote {
  const vehicle = input.vehicleType ?? "motorcycle";
  const vMult = vehicleMultiplier(vehicle, cfg);
  const peakMult = isPeakHour(input.at) ? cfg.peak_multiplier : 1;

  const baseFare = cfg.base_fare;
  const distanceCharge = Math.max(0, input.distanceKm) * cfg.per_km_rate;
  const billableKg = Math.max(0, input.weightKg - cfg.free_kg);
  const weightCharge = billableKg * cfg.per_kg_rate;

  let subtotal = (baseFare + distanceCharge + weightCharge) * vMult;
  subtotal *= peakMult;
  const total = Math.max(cfg.min_fare, Math.round(subtotal * 100) / 100);

  const breakdown = [
    `Base fare GHS ${baseFare.toFixed(2)}`,
    `Distance ${input.distanceKm.toFixed(1)} km × GHS ${cfg.per_km_rate} = GHS ${distanceCharge.toFixed(2)}`,
    billableKg > 0
      ? `Weight ${billableKg.toFixed(0)} kg (over ${cfg.free_kg} kg free) × GHS ${cfg.per_kg_rate} = GHS ${weightCharge.toFixed(2)}`
      : `Weight ${input.weightKg.toFixed(0)} kg included (first ${cfg.free_kg} kg free)`,
    vMult !== 1 ? `Vehicle (${vehicle}) ×${vMult}` : `Vehicle: ${vehicle}`,
    peakMult > 1 ? `Peak hour ×${peakMult}` : "Off-peak rate",
    total === cfg.min_fare && subtotal < cfg.min_fare ? `Minimum fare GHS ${cfg.min_fare} applied` : "",
  ].filter(Boolean);

  return {
    baseFare,
    distanceCharge,
    weightCharge,
    vehicleMultiplier: vMult,
    peakMultiplier: peakMult,
    subtotal,
    total,
    breakdown,
  };
}

export function calculatePlatformFee(subtotal: number, cfg: PricingConfig = DEFAULT_PRICING): number {
  return Math.round(subtotal * cfg.platform_fee_pct * 100) / 100;
}
