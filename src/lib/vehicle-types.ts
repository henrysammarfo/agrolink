/** Driver / delivery vehicle taxonomy — motor, bicycle, car */

export type DriverVehicleType = "bicycle" | "motorcycle" | "car" | "pickup" | "truck" | "minivan";

export const VEHICLE_FILTER_OPTIONS = [
  { value: "all" as const, label: "All vehicles" },
  { value: "bicycle" as const, label: "Bicycle" },
  { value: "motorcycle" as const, label: "Motor" },
  { value: "car" as const, label: "Car" },
] as const;

export type VehicleFilter = (typeof VEHICLE_FILTER_OPTIONS)[number]["value"];

/** Radius expansion per offer round (km) — Bolt-style widen search */
export const RADIUS_BY_OFFER_ROUND = [20, 50, 100, 200, 500] as const;

export function radiusForOfferRound(round: number): number {
  const idx = Math.min(Math.max(round - 1, 0), RADIUS_BY_OFFER_ROUND.length - 1);
  return RADIUS_BY_OFFER_ROUND[idx];
}

/** Normalize DB vehicle_type to filter bucket */
export function vehicleToFilterBucket(type: string | null | undefined): VehicleFilter {
  const t = (type ?? "motorcycle").toLowerCase();
  if (t === "bicycle") return "bicycle";
  if (t === "motorcycle") return "motorcycle";
  if (t === "car" || t === "pickup" || t === "minivan" || t === "truck") return "car";
  return "motorcycle";
}

/** Can this driver vehicle fulfill the job requirement? Exact bucket match only. */
export function vehicleCanFulfill(
  driverType: string | null | undefined,
  requiredType: string | null | undefined,
): boolean {
  if (!requiredType) return true;
  const driver = vehicleToFilterBucket(driverType);
  const required = vehicleToFilterBucket(requiredType);
  return driver === required;
}

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
