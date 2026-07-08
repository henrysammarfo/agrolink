import { fetchDrivingDistanceKm, fetchGoogleDirections, getGoogleMapsApiKey } from "@/server/google-maps";

export type LatLng = { lat: number; lng: number; label?: string };

function haversineKm(from: LatLng, to: LatLng): number {
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

/** Nearest-neighbor TSP heuristic for multi-farm pickup ordering */
export function orderPickupStops(stops: LatLng[], start?: LatLng): LatLng[] {
  if (stops.length <= 1) return [...stops];
  const remaining = [...stops];
  const ordered: LatLng[] = [];
  let current = start ?? remaining.shift()!;
  if (!start && ordered.length === 0) {
    ordered.push(current);
  } else if (start) {
    let bestIdx = 0;
    let bestDist = Infinity;
    remaining.forEach((s, i) => {
      const d = haversineKm(start, s);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    current = remaining.splice(bestIdx, 1)[0];
    ordered.push(current);
  }
  while (remaining.length) {
    let bestIdx = 0;
    let bestDist = Infinity;
    remaining.forEach((s, i) => {
      const d = haversineKm(current, s);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    current = remaining.splice(bestIdx, 1)[0];
    ordered.push(current);
  }
  return ordered;
}

/** Sum driving distances through ordered pickup stops then to delivery */
export async function computeMultiStopDistanceKm(
  pickups: LatLng[],
  delivery: LatLng,
): Promise<{
  distanceKm: number;
  orderedStops: LatLng[];
  routingSource: "google" | "osrm" | "haversine";
}> {
  const orderedStops = orderPickupStops(pickups);

  if (getGoogleMapsApiKey() && orderedStops.length > 0) {
    try {
      const route = await fetchGoogleDirections(
        orderedStops[0],
        delivery,
        orderedStops.length > 1 ? orderedStops.slice(1) : undefined,
      );
      if (route) {
        return { distanceKm: route.distance_km, orderedStops, routingSource: "google" };
      }
    } catch (err) {
      console.warn("[BatchRouting] Google Directions failed:", err);
    }
  }

  let total = 0;
  let source: "google" | "osrm" | "haversine" = "haversine";
  let prev: LatLng | null = null;
  for (const stop of orderedStops) {
    if (prev) {
      const seg = await fetchDrivingDistanceKm(prev, stop);
      total += seg.distanceKm;
      if (seg.source === "google") source = "google";
      else if (seg.source === "osrm" && source !== "google") source = "osrm";
    }
    prev = stop;
  }
  if (prev) {
    const last = await fetchDrivingDistanceKm(prev, delivery);
    total += last.distanceKm;
    if (last.source === "google") source = "google";
    else if (last.source === "osrm" && source !== "google") source = "osrm";
  }
  return { distanceKm: total, orderedStops, routingSource: source };
}
