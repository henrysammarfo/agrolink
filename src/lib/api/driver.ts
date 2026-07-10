import { supabase } from "@/integrations/supabase/client";
import { watchDriverPosition } from "@/lib/native-geolocation";
import { fetchDrivingRoute as fetchGoogleRoute, type DrivingRoute, type RouteStep } from "@/lib/api/maps";
import type { DriverProfile } from "@/lib/types/marketplace";

export async function getOrCreateDriverProfile(userId: string): Promise<DriverProfile> {
  const { data: existing } = await supabase
    .from("driver_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return existing as DriverProfile;

  const { data, error } = await supabase
    .from("driver_profiles")
    .insert({ user_id: userId, vehicle_type: "motorcycle", available: false })
    .select()
    .single();
  if (error) throw error;
  return data as DriverProfile;
}

export async function updateDriverAvailability(userId: string, available: boolean) {
  const { error } = await supabase
    .from("driver_profiles")
    .update({ available, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (error) throw error;
}

export async function updateDriverLocation(userId: string, lat: number, lng: number) {
  const { error } = await supabase
    .from("driver_profiles")
    .update({ current_lat: lat, current_lng: lng, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (error) throw error;
}

export async function updateDriverProfile(userId: string, updates: Partial<DriverProfile>) {
  const { error } = await supabase
    .from("driver_profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (error) throw error;
}

export type DrivingRouteResult = DrivingRoute;

function parseOsrmSteps(steps: {
  maneuver?: { instruction?: string; type?: string };
  distance: number;
  duration: number;
  geometry?: { coordinates: [number, number][] };
}[]): RouteStep[] {
  return steps.map((s) => {
    const end = s.geometry?.coordinates?.at(-1);
    return {
      instruction: s.maneuver?.instruction ?? "Continue",
      distance_m: s.distance,
      duration_min: s.duration / 60,
      maneuver: s.maneuver?.type,
      end_lat: end?.[1] ?? 0,
      end_lng: end?.[0] ?? 0,
    };
  });
}

/** Full road routing — Google Directions (step polylines) with OSRM fallback. */
export async function fetchDrivingRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<DrivingRouteResult | null> {
  const google = await fetchGoogleRoute(from, to);
  if (google?.coordinates?.length) {
    console.info(`[routing] Google Directions: ${google.coordinates.length} points, ${google.steps?.length ?? 0} steps`);
    return google;
  }

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      routes?: {
        distance: number;
        duration: number;
        geometry: { coordinates: [number, number][] };
        legs?: { steps?: Parameters<typeof parseOsrmSteps>[0] }[];
      }[];
    };
    const route = json.routes?.[0];
    if (!route) return null;
    const steps = parseOsrmSteps(route.legs?.[0]?.steps ?? []);
    console.info(`[routing] OSRM fallback: ${route.geometry.coordinates.length} points, ${steps.length} steps`);
    return {
      coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distance_km: route.distance / 1000,
      duration_min: route.duration / 60,
      source: "osrm",
      steps,
    };
  } catch (err) {
    console.warn("[routing] OSRM fallback failed:", err);
    return null;
  }
}

/** @deprecated Use fetchDrivingRoute */
export const fetchOsrmRoute = fetchDrivingRoute;

export async function goOnlineWithLocation(userId: string): Promise<boolean> {
  const { requestLocationPermission, getCurrentPosition } = await import("@/lib/native-geolocation");
  await requestLocationPermission();
  const pos = await getCurrentPosition();
  if (!pos) return false;
  await updateDriverLocation(userId, pos.lat, pos.lng);
  await updateDriverAvailability(userId, true);
  return true;
}

export function startDriverLocationWatch(
  userId: string,
  onUpdate: (lat: number, lng: number) => void,
) {
  return watchDriverPosition(
    ({ lat, lng }) => {
      onUpdate(lat, lng);
      updateDriverLocation(userId, lat, lng).catch(console.error);
    },
    (msg) => console.warn("[Driver] Geolocation error:", msg),
  );
}
