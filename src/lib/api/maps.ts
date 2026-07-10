import { apiFetch } from "@/lib/api/fetch-auth";

export type MapLocation = {
  name: string;
  lat: number;
  lng: number;
};

export type PlaceSuggestion = {
  placeId: string;
  description: string;
  mainText: string;
};

export type RouteStep = {
  instruction: string;
  distance_m: number;
  duration_min: number;
  maneuver?: string;
  end_lat: number;
  end_lng: number;
};

export type DrivingRoute = {
  coordinates: [number, number][];
  distance_km: number;
  duration_min: number;
  duration_in_traffic_min?: number;
  source: "google" | "osrm";
  steps?: RouteStep[];
};

async function mapsPost<T>(body: Record<string, unknown>): Promise<T> {
  const res = await apiFetch("/api/maps", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(json.error ?? `Maps API failed (${res.status})`);
  return json;
}

export async function geocodeAddress(address: string): Promise<MapLocation> {
  return mapsPost({ action: "geocode", address });
}

export async function reverseGeocode(lat: number, lng: number): Promise<MapLocation> {
  return mapsPost({ action: "reverse", lat, lng });
}

export async function fetchPlaceSuggestions(input: string): Promise<PlaceSuggestion[]> {
  const json = await mapsPost<{ suggestions: PlaceSuggestion[] }>({
    action: "autocomplete",
    input,
  });
  return json.suggestions ?? [];
}

export async function resolvePlace(placeId: string): Promise<MapLocation> {
  return mapsPost({ action: "place", placeId });
}

export async function fetchDrivingRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<DrivingRoute | null> {
  try {
    return await mapsPost<DrivingRoute>({
      action: "directions",
      origin: from,
      destination: to,
    });
  } catch {
    return null;
  }
}
