/** Discreet driver coverage — never expose exact live driver GPS before assignment. */

/** Approximate km offset from pickup for a stable “coverage” indicator (not driver home). */
export function discreetCoverageNearPickup(
  pickupLat: number,
  pickupLng: number,
  driverCount: number,
): { lat: number; lng: number; radiusKm: number } | null {
  if (driverCount <= 0) return null;

  const seed = Math.abs(Math.sin(pickupLat * 12.9898 + pickupLng * 78.233) * 43758.5453);
  const angle = (seed % 1) * 2 * Math.PI;
  const offsetKm = 0.6 + (seed % 0.7);

  const lat = pickupLat + (offsetKm / 111) * Math.cos(angle);
  const lng =
    pickupLng +
    (offsetKm / (111 * Math.cos((pickupLat * Math.PI) / 180))) * Math.sin(angle);

  return {
    lat,
    lng,
    radiusKm: 1 + Math.min(driverCount, 4) * 0.25,
  };
}
