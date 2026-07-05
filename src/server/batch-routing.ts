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
    // find nearest to start
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

async function osrmSegmentKm(from: LatLng, to: LatLng): Promise<number | null> {
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

/** Sum OSRM segment distances through ordered pickup stops then to delivery */
export async function computeMultiStopDistanceKm(
  pickups: LatLng[],
  delivery: LatLng,
): Promise<{ distanceKm: number; orderedStops: LatLng[] }> {
  const orderedStops = orderPickupStops(pickups);
  let total = 0;
  let prev: LatLng | null = null;
  for (const stop of orderedStops) {
    if (prev) {
      const seg = (await osrmSegmentKm(prev, stop)) ?? haversineKm(prev, stop);
      total += seg;
    }
    prev = stop;
  }
  if (prev) {
    const last = (await osrmSegmentKm(prev, delivery)) ?? haversineKm(prev, delivery);
    total += last;
  }
  return { distanceKm: total, orderedStops };
}
