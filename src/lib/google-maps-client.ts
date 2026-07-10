import { Loader } from "@googlemaps/js-api-loader";

let loader: Loader | null = null;
let loadPromise: Promise<typeof google> | null = null;

export function getGoogleMapsClientKey(): string | null {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return key?.trim() ? key.trim() : null;
}

export function loadGoogleMaps(): Promise<typeof google> {
  const key = getGoogleMapsClientKey();
  if (!key) return Promise.reject(new Error("VITE_GOOGLE_MAPS_API_KEY not configured"));

  if (!loader) {
    loader = new Loader({
      apiKey: key,
      version: "weekly",
      libraries: ["marker"],
    });
  }

  if (!loadPromise) {
    loadPromise = loader.load();
  }
  return loadPromise;
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
