/** Ghana corridor bounds — reject bogus 0,0 and world-scale coords */
export function isValidMapCoord(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return false;
  return lat >= 4 && lat <= 12 && lng >= -4 && lng <= 2;
}

export const ACCRA_CENTER: [number, number] = [5.6037, -0.187];
export const DEFAULT_MAP_ZOOM = 13;
export const STREET_ZOOM = 15;
