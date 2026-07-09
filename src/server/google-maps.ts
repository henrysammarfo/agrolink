export type GeoResult = {
  name: string;
  lat: number;
  lng: number;
};

export type PlaceSuggestion = {
  placeId: string;
  description: string;
  mainText: string;
};

export type DirectionStep = {
  instruction: string;
  distance_m: number;
  duration_min: number;
  maneuver?: string;
  end_lat: number;
  end_lng: number;
};

export type DrivingRoute = {
  coordinates: [number, number][];
  distance_km: number;
  duration_min: number;
  duration_in_traffic_min?: number;
  source: "google" | "osrm";
  steps?: DirectionStep[];
};

const ACCRA_BIAS = { lat: 5.6037, lng: -0.187 };

export function getGoogleMapsApiKey(): string | null {
  return process.env.GOOGLE_MAPS_API_KEY ?? process.env.VITE_GOOGLE_MAPS_API_KEY ?? null;
}

async function googleFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = getGoogleMapsApiKey();
  if (!key) throw new Error("GOOGLE_MAPS_API_KEY not configured");

  const qs = new URLSearchParams({ ...params, key });
  const res = await fetch(`https://maps.googleapis.com/maps/api/${path}?${qs}`);
  const json = (await res.json()) as T & { status?: string; error_message?: string };
  const status = (json as { status?: string }).status;
  if (status && status !== "OK" && status !== "ZERO_RESULTS") {
    throw new Error(
      (json as { error_message?: string }).error_message ?? `Google Maps API: ${status}`,
    );
  }
  return json;
}

export async function geocodeAddress(address: string): Promise<GeoResult | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;

  const json = await googleFetch<{
    results?: { formatted_address: string; geometry: { location: { lat: number; lng: number } } }[];
  }>("geocode/json", {
    address: trimmed,
    region: "gh",
    components: "country:GH",
  });

  const hit = json.results?.[0];
  if (!hit) return null;
  return {
    name: hit.formatted_address,
    lat: hit.geometry.location.lat,
    lng: hit.geometry.location.lng,
  };
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeoResult | null> {
  const json = await googleFetch<{
    results?: { formatted_address: string; geometry: { location: { lat: number; lng: number } } }[];
  }>("geocode/json", {
    latlng: `${lat},${lng}`,
    region: "gh",
  });

  const hit = json.results?.[0];
  if (!hit) return null;
  return {
    name: hit.formatted_address,
    lat: hit.geometry.location.lat,
    lng: hit.geometry.location.lng,
  };
}

export async function placeAutocomplete(input: string): Promise<PlaceSuggestion[]> {
  const trimmed = input.trim();
  if (trimmed.length < 2) return [];

  const json = await googleFetch<{
    predictions?: {
      place_id: string;
      description: string;
      structured_formatting?: { main_text?: string };
    }[];
  }>("place/autocomplete/json", {
    input: trimmed,
    components: "country:gh",
    location: `${ACCRA_BIAS.lat},${ACCRA_BIAS.lng}`,
    radius: "80000",
    types: "geocode|establishment",
  });

  return (json.predictions ?? []).map((p) => ({
    placeId: p.place_id,
    description: p.description,
    mainText: p.structured_formatting?.main_text ?? p.description,
  }));
}

export async function placeDetails(placeId: string): Promise<GeoResult | null> {
  const json = await googleFetch<{
    result?: {
      formatted_address?: string;
      name?: string;
      geometry?: { location: { lat: number; lng: number } };
    };
  }>("place/details/json", {
    place_id: placeId,
    fields: "geometry,formatted_address,name",
  });

  const hit = json.result;
  if (!hit?.geometry?.location) return null;
  return {
    name: hit.formatted_address ?? hit.name ?? "Selected location",
    lat: hit.geometry.location.lat,
    lng: hit.geometry.location.lng,
  };
}

function decodePolyline(encoded: string): [number, number][] {
  const coords: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coords.push([lat / 1e5, lng / 1e5]);
  }

  return coords;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
}

function buildDetailedCoordinates(route: {
  legs?: {
    steps?: { polyline?: { points: string }; html_instructions?: string; distance?: { value: number }; duration?: { value: number }; maneuver?: string; end_location?: { lat: number; lng: number } }[];
    distance?: { value: number };
    duration?: { value: number };
    duration_in_traffic?: { value: number };
  }[];
  overview_polyline?: { points: string };
}): [number, number][] {
  const coords: [number, number][] = [];
  for (const leg of route.legs ?? []) {
    for (const step of leg.steps ?? []) {
      const poly = step.polyline?.points;
      if (!poly) continue;
      for (const c of decodePolyline(poly)) {
        const last = coords[coords.length - 1];
        if (!last || Math.abs(last[0] - c[0]) > 1e-6 || Math.abs(last[1] - c[1]) > 1e-6) {
          coords.push(c);
        }
      }
    }
  }
  if (coords.length >= 2) return coords;
  if (route.overview_polyline?.points) return decodePolyline(route.overview_polyline.points);
  return coords;
}

function extractSteps(route: {
  legs?: {
    steps?: {
      html_instructions?: string;
      distance?: { value: number };
      duration?: { value: number };
      maneuver?: string;
      end_location?: { lat: number; lng: number };
    }[];
  }[];
}): DirectionStep[] {
  const steps: DirectionStep[] = [];
  for (const leg of route.legs ?? []) {
    for (const step of leg.steps ?? []) {
      if (!step.end_location) continue;
      steps.push({
        instruction: stripHtml(step.html_instructions ?? "Continue"),
        distance_m: step.distance?.value ?? 0,
        duration_min: (step.duration?.value ?? 0) / 60,
        maneuver: step.maneuver,
        end_lat: step.end_location.lat,
        end_lng: step.end_location.lng,
      });
    }
  }
  return steps;
}

export async function fetchGoogleDirections(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  waypoints?: { lat: number; lng: number }[],
): Promise<DrivingRoute | null> {
  const params: Record<string, string> = {
    origin: `${from.lat},${from.lng}`,
    destination: `${to.lat},${to.lng}`,
    mode: "driving",
    region: "gh",
    departure_time: "now",
    traffic_model: "best_guess",
  };
  if (waypoints?.length) {
    params.waypoints = waypoints.map((w) => `${w.lat},${w.lng}`).join("|");
  }

  const json = await googleFetch<{
    routes?: {
      legs?: {
        distance: { value: number };
        duration: { value: number };
        duration_in_traffic?: { value: number };
        steps?: {
          html_instructions?: string;
          distance?: { value: number };
          duration?: { value: number };
          maneuver?: string;
          polyline?: { points: string };
          end_location?: { lat: number; lng: number };
        }[];
      }[];
      overview_polyline?: { points: string };
    }[];
  }>("directions/json", params);

  const route = json.routes?.[0];
  if (!route?.legs?.length) return null;

  const distance_m = route.legs.reduce((sum, leg) => sum + leg.distance.value, 0);
  const duration_s = route.legs.reduce((sum, leg) => sum + leg.duration.value, 0);
  const traffic_s = route.legs.reduce(
    (sum, leg) => sum + (leg.duration_in_traffic?.value ?? leg.duration.value),
    0,
  );
  const coordinates = buildDetailedCoordinates(route);
  if (coordinates.length < 2) return null;

  return {
    coordinates,
    distance_km: distance_m / 1000,
    duration_min: duration_s / 60,
    duration_in_traffic_min: traffic_s / 60,
    source: "google",
    steps: extractSteps(route),
  };
}

export async function fetchDrivingDistanceKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<{ distanceKm: number; source: "google" | "osrm" | "haversine" }> {
  if (getGoogleMapsApiKey()) {
    try {
      const route = await fetchGoogleDirections(from, to);
      if (route) return { distanceKm: route.distance_km, source: "google" };
    } catch (err) {
      console.warn("[GoogleMaps] Directions failed, falling back to OSRM:", err);
    }
  }

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
    const res = await fetch(url);
    const json = (await res.json()) as { routes?: { distance: number }[] };
    const route = json.routes?.[0];
    if (route) return { distanceKm: route.distance / 1000, source: "osrm" };
  } catch {
    /* fall through */
  }

  const R = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return { distanceKm: R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)), source: "haversine" };
}
