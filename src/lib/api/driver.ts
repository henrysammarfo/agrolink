import { supabase } from "@/integrations/supabase/client";
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

export type OsrmRoute = {
  coordinates: [number, number][];
  distance_km: number;
  duration_min: number;
};

export async function fetchOsrmRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<OsrmRoute | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const json = (await res.json()) as {
      routes?: {
        distance: number;
        duration: number;
        geometry: { coordinates: [number, number][] };
      }[];
    };
    const route = json.routes?.[0];
    if (!route) return null;
    return {
      coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distance_km: route.distance / 1000,
      duration_min: route.duration / 60,
    };
  } catch {
    return null;
  }
}

export function startDriverLocationWatch(
  userId: string,
  onUpdate: (lat: number, lng: number) => void,
) {
  if (!navigator.geolocation) return () => {};

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      onUpdate(latitude, longitude);
      updateDriverLocation(userId, latitude, longitude).catch(console.error);
    },
    (err) => console.warn("[Driver] Geolocation error:", err),
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
  );

  return () => navigator.geolocation.clearWatch(watchId);
}
