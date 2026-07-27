/** Mapbox GL JS client helpers — public token only (URL-restrict in dashboard). */

export function getMapboxClientToken(): string | null {
  const key = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  return key?.trim() ? key.trim() : null;
}

export const MAPBOX_STYLE_DARK = "mapbox://styles/mapbox/dark-v11";
export const MAPBOX_STYLE_LIGHT = "mapbox://styles/mapbox/streets-v12";
