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

/** Greater Accra corridor — default viewport for marketplace / delivery maps */
export const GREATER_ACCRA_BOUNDS = {
  south: 5.45,
  west: -0.42,
  north: 6.05,
  east: 0.78,
} as const;

export const GREATER_ACCRA_SW: [number, number] = [GREATER_ACCRA_BOUNDS.south, GREATER_ACCRA_BOUNDS.west];
export const GREATER_ACCRA_NE: [number, number] = [GREATER_ACCRA_BOUNDS.north, GREATER_ACCRA_BOUNDS.east];
export const GREATER_ACCRA_ZOOM = 11;

/** Clamp a point inside Greater Accra bounds */
export function clampToGreaterAccra(lat: number, lng: number): [number, number] {
  return [
    Math.min(GREATER_ACCRA_BOUNDS.north, Math.max(GREATER_ACCRA_BOUNDS.south, lat)),
    Math.min(GREATER_ACCRA_BOUNDS.east, Math.max(GREATER_ACCRA_BOUNDS.west, lng)),
  ];
}

/** True when coordinates fall inside the Accra corridor */
export function isInGreaterAccra(lat: number, lng: number): boolean {
  return (
    lat >= GREATER_ACCRA_BOUNDS.south &&
    lat <= GREATER_ACCRA_BOUNDS.north &&
    lng >= GREATER_ACCRA_BOUNDS.west &&
    lng <= GREATER_ACCRA_BOUNDS.east
  );
}

export const ACCRA_CENTER: [number, number] = [5.6037, -0.187];
export const DEFAULT_MAP_ZOOM = 13;
export const STREET_ZOOM = 15;
export const GHANA_MIN_ZOOM = 7;
export const GHANA_OVERVIEW_ZOOM = 7;
