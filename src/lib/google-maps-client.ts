import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

let configured = false;
let mapsPromise: Promise<typeof google.maps> | null = null;

export function getGoogleMapsClientKey(): string | null {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return key?.trim() ? key.trim() : null;
}

/** Load Maps JavaScript API (v2 loader — setOptions + importLibrary). */
export function loadGoogleMaps(): Promise<typeof google.maps> {
  const key = getGoogleMapsClientKey();
  if (!key) throw new Error("VITE_GOOGLE_MAPS_API_KEY not configured");

  if (!configured) {
    setOptions({ key, v: "weekly" });
    configured = true;
  }

  if (!mapsPromise) {
    mapsPromise = importLibrary("maps").then(() => google.maps);
  }
  return mapsPromise;
}

/** AgroLink dark map styling — matches checkout / transport night UI. */
export const GOOGLE_MAP_DARK_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1a2332" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b0" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a2332" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2c3e50" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1f2d3d" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3d5166" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

export const GOOGLE_MAP_LIGHT_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];
