import { Capacitor } from "@capacitor/core";
import { Geolocation, type PositionCallback } from "@capacitor/geolocation";

export type GeoPosition = { lat: number; lng: number; accuracy?: number };

export async function requestLocationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;
  try {
    const status = await Geolocation.requestPermissions();
    return status.location === "granted" || status.coarseLocation === "granted";
  } catch {
    return false;
  }
}

export async function getCurrentPosition(): Promise<GeoPosition | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
      });
      return {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      };
    } catch {
      return null;
    }
  }
  if (!navigator.geolocation) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: p.coords.accuracy,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  });
}

/** Watch driver position — Capacitor on native APK, browser geolocation on web */
export function watchDriverPosition(
  onUpdate: (pos: GeoPosition) => void,
  onError?: (message: string) => void,
): () => void {
  if (Capacitor.isNativePlatform()) {
    let watchId: string | null = null;
    void (async () => {
      await requestLocationPermission();
      watchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 15000 },
        (position, err) => {
          if (err) {
            onError?.(err.message);
            return;
          }
          if (!position) return;
          onUpdate({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
      );
    })();
    return () => {
      if (watchId) void Geolocation.clearWatch({ id: watchId });
    };
  }

  if (!navigator.geolocation) return () => {};
  const id = navigator.geolocation.watchPosition(
    (pos) =>
      onUpdate({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
    (err) => onError?.(err.message),
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
  );
  return () => navigator.geolocation.clearWatch(id);
}
