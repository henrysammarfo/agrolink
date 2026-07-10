/** Ghana corridor bounds — reject bogus 0,0 and world-scale coords */
export function isValidMapCoord(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return false;
  return lat >= 4 && lat <= 12 && lng >= -4 && lng <= 2;
}

/** Tighter viewport for map restriction (Ghana only). */
export const GHANA_BOUNDS = {
  south: 4.5,
  west: -3.4,
  north: 11.2,
  east: 1.3,
} as const;

export const GHANA_SW: [number, number] = [GHANA_BOUNDS.south, GHANA_BOUNDS.west];
export const GHANA_NE: [number, number] = [GHANA_BOUNDS.north, GHANA_BOUNDS.east];
export const GHANA_CENTER: [number, number] = [7.95, -1.02];

export const ACCRA_CENTER: [number, number] = [5.6037, -0.187];
export const DEFAULT_MAP_ZOOM = 13;
export const STREET_ZOOM = 15;
export const GHANA_MIN_ZOOM = 7;
export const GHANA_OVERVIEW_ZOOM = 7;
