import { supabase } from "@/integrations/supabase/client";
import { watchDriverPosition } from "@/lib/native-geolocation";
import {
  fetchDrivingRoute as fetchMapboxRoute,
  snapGpsToRoads,
  type DrivingRoute,
  type RouteStep,
} from "@/lib/api/maps";
import type { DriverProfile } from "@/lib/types/marketplace";

const SNAP_MIN_INTERVAL_MS = 8_000;
const SNAP_MIN_MOVE_M = 25;

function haversineM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

async function publishDriverLocation(
  userId: string,
  lat: number,
  lng: number,
  onUpdate: (lat: number, lng: number) => void,
  snapState: { lastSnapAt: number; lastSnap: { lat: number; lng: number } | null },
) {
  let publishLat = lat;
  let publishLng = lng;
  const now = Date.now();
  const moved =
    !snapState.lastSnap || haversineM(snapState.lastSnap, { lat, lng }) >= SNAP_MIN_MOVE_M;

  if (moved && now - snapState.lastSnapAt >= SNAP_MIN_INTERVAL_MS) {
    const snapped = await snapGpsToRoads(lat, lng);
    if (snapped) {
      publishLat = snapped.lat;
      publishLng = snapped.lng;
      snapState.lastSnapAt = now;
      snapState.lastSnap = snapped;
    }
  }

  onUpdate(publishLat, publishLng);
  await updateDriverLocation(userId, publishLat, publishLng);
}

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

/** Full road routing — Mapbox Directions with OSRM fallback. */
export async function fetchDrivingRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<DrivingRouteResult | null> {
  const mapbox = await fetchMapboxRoute(from, to);
  if (mapbox?.coordinates?.length) {
    console.info(`[routing] Mapbox Directions: ${mapbox.coordinates.length} points, ${mapbox.steps?.length ?? 0} steps`);
    return mapbox;
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
  const snapped = (await snapGpsToRoads(pos.lat, pos.lng)) ?? pos;
  await updateDriverLocation(userId, snapped.lat, snapped.lng);
  await updateDriverAvailability(userId, true);
  return true;
}

export function startDriverLocationWatch(
  userId: string,
  onUpdate: (lat: number, lng: number) => void,
) {
  const snapState = { lastSnapAt: 0, lastSnap: null as { lat: number; lng: number } | null };

  return watchDriverPosition(
    ({ lat, lng }) => {
      publishDriverLocation(userId, lat, lng, onUpdate, snapState).catch(console.error);
    },
    (msg) => console.warn("[Driver] Geolocation error:", msg),
  );
}
