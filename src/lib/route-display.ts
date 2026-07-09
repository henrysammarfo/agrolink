import type { RouteStep } from "@/lib/api/maps";

export type RouteSegment = {
  coordinates: [number, number][];
  color: string;
};

/** Split a full route into traffic-colored segments from turn-by-turn steps. */
export function buildTrafficSegments(
  coordinates: [number, number][],
  steps?: RouteStep[],
): RouteSegment[] {
  if (!steps?.length || coordinates.length < 2) {
    return [{ coordinates, color: "#22c55e" }];
  }

  const segments: RouteSegment[] = [];
  let cursor = 0;

  for (const step of steps) {
    if (!step.end_lat || !step.end_lng) continue;

    let endIdx = cursor;
    let bestDist = Infinity;
    for (let i = cursor + 1; i < coordinates.length; i++) {
      const [lat, lng] = coordinates[i];
      const d = Math.hypot(lat - step.end_lat, lng - step.end_lng);
      if (d < bestDist) {
        bestDist = d;
        endIdx = i;
      }
    }
    if (endIdx <= cursor) endIdx = Math.min(cursor + 1, coordinates.length - 1);

    const slice = coordinates.slice(cursor, endIdx + 1);
    if (slice.length >= 2) {
      const mins = step.duration_min || 1;
      const color = mins >= 3 ? "#ef4444" : mins >= 1.5 ? "#eab308" : "#22c55e";
      segments.push({ coordinates: slice, color });
    }
    cursor = endIdx;
  }

  if (cursor < coordinates.length - 1) {
    segments.push({ coordinates: coordinates.slice(cursor), color: "#22c55e" });
  }

  return segments.length ? segments : [{ coordinates, color: "#22c55e" }];
}

export function estimateDriverPayout(job: {
  delivery_fee?: number | null;
  estimated_distance_km?: number | null;
}): number | null {
  if (job.delivery_fee != null) return Number(job.delivery_fee);
  if (job.estimated_distance_km != null) {
    return Math.max(8, Math.round(Number(job.estimated_distance_km) * 1.2 + 5));
  }
  return null;
}
