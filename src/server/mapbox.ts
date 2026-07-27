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
  source: "mapbox" | "osrm" | "haversine";
  steps?: DirectionStep[];
};

export type MatrixElement = {
  duration_min: number;
  duration_in_traffic_min?: number;
  distance_km: number;
  status: string;
};

const ACCRA_BIAS = { lng: -0.187, lat: 5.6037 };
const MAPBOX_API = "https://api.mapbox.com";

export function getMapboxAccessToken(): string | null {
  const token =
    process.env.MAPBOX_ACCESS_TOKEN ??
    process.env.VITE_MAPBOX_ACCESS_TOKEN ??
    null;
  return token?.trim() ? token.trim() : null;
}

/** @deprecated Use getMapboxAccessToken — kept for gradual import migration */
export function getGoogleMapsApiKey(): string | null {
  return getMapboxAccessToken();
}

function haversineKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function mapboxGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const token = getMapboxAccessToken();
  if (!token) throw new Error("MAPBOX_ACCESS_TOKEN not configured");

  const qs = new URLSearchParams({ ...params, access_token: token });
  const res = await fetch(`${MAPBOX_API}${path}?${qs}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Mapbox API ${res.status}: ${text.slice(0, 200) || res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function geocodeAddress(address: string): Promise<GeoResult | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;

  const json = await mapboxGet<{
    features?: {
      place_name?: string;
      center?: [number, number];
    }[];
  }>(`/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json`, {
    country: "gh",
    limit: "1",
    proximity: `${ACCRA_BIAS.lng},${ACCRA_BIAS.lat}`,
  });

  const hit = json.features?.[0];
  if (!hit?.center) return null;
  return {
    name: hit.place_name ?? trimmed,
    lng: hit.center[0],
    lat: hit.center[1],
  };
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeoResult | null> {
  const json = await mapboxGet<{
    features?: {
      place_name?: string;
      center?: [number, number];
    }[];
  }>(`/geocoding/v5/mapbox.places/${lng},${lat}.json`, {
    country: "gh",
    limit: "1",
  });

  const hit = json.features?.[0];
  if (!hit) return null;
  return {
    name: hit.place_name ?? "Selected location",
    lat: hit.center?.[1] ?? lat,
    lng: hit.center?.[0] ?? lng,
  };
}

export async function placeAutocomplete(input: string): Promise<PlaceSuggestion[]> {
  const trimmed = input.trim();
  if (trimmed.length < 2) return [];

  const json = await mapboxGet<{
    features?: {
      id?: string;
      place_name?: string;
      text?: string;
    }[];
  }>(`/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json`, {
    country: "gh",
    autocomplete: "true",
    limit: "6",
    proximity: `${ACCRA_BIAS.lng},${ACCRA_BIAS.lat}`,
    types: "place,locality,neighborhood,address,poi",
  });

  return (json.features ?? []).map((f) => ({
    placeId: f.id ?? f.place_name ?? "",
    description: f.place_name ?? f.text ?? "",
    mainText: f.text ?? f.place_name ?? "",
  }));
}

export async function placeDetails(placeId: string): Promise<GeoResult | null> {
  // Mapbox autocomplete returns feature ids like "place.123" — re-query by that id via forward geocode of description if needed.
  // Feature retrieve: use the id in geocoding when it looks like a mapbox id.
  if (placeId.includes(".")) {
    const json = await mapboxGet<{
      features?: {
        place_name?: string;
        center?: [number, number];
      }[];
    }>(`/geocoding/v5/mapbox.places/${encodeURIComponent(placeId)}.json`, {
      country: "gh",
      limit: "1",
    });
    const hit = json.features?.[0];
    if (hit?.center) {
      return {
        name: hit.place_name ?? "Selected location",
        lng: hit.center[0],
        lat: hit.center[1],
      };
    }
  }
  return geocodeAddress(placeId);
}

type MapboxRouteResponse = {
  code?: string;
  routes?: {
    distance: number;
    duration: number;
    duration_typical?: number;
    geometry: { coordinates: [number, number][]; type: string };
    legs?: {
      steps?: {
        maneuver?: {
          instruction?: string;
          type?: string;
          modifier?: string;
          location?: [number, number];
        };
        distance?: number;
        duration?: number;
      }[];
    }[];
  }[];
};

function extractSteps(route: NonNullable<MapboxRouteResponse["routes"]>[0]): DirectionStep[] {
  const steps: DirectionStep[] = [];
  for (const leg of route.legs ?? []) {
    for (const step of leg.steps ?? []) {
      const loc = step.maneuver?.location;
      if (!loc) continue;
      const maneuver =
        [step.maneuver?.type, step.maneuver?.modifier].filter(Boolean).join(" ") || undefined;
      steps.push({
        instruction: step.maneuver?.instruction ?? "Continue",
        distance_m: step.distance ?? 0,
        duration_min: (step.duration ?? 0) / 60,
        maneuver,
        end_lng: loc[0],
        end_lat: loc[1],
      });
    }
  }
  return steps;
}

export async function fetchMapboxDirections(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  waypoints?: { lat: number; lng: number }[],
): Promise<DrivingRoute | null> {
  const token = getMapboxAccessToken();
  if (!token) return null;

  const coords = [
    `${from.lng},${from.lat}`,
    ...(waypoints ?? []).map((w) => `${w.lng},${w.lat}`),
    `${to.lng},${to.lat}`,
  ].join(";");

  const json = await mapboxGet<MapboxRouteResponse>(
    `/directions/v5/mapbox/driving-traffic/${coords}`,
    {
      geometries: "geojson",
      overview: "full",
      steps: "true",
      annotations: "duration,distance",
    },
  );

  if (json.code && json.code !== "Ok") return null;
  const route = json.routes?.[0];
  if (!route?.geometry?.coordinates?.length) return null;

  // Mapbox returns [lng, lat]; CorridorMap expects [lat, lng]
  const coordinates = route.geometry.coordinates.map(
    ([lng, lat]) => [lat, lng] as [number, number],
  );
  if (coordinates.length < 2) return null;

  const duration_min = route.duration / 60;
  const typical = route.duration_typical != null ? route.duration_typical / 60 : undefined;

  return {
    coordinates,
    distance_km: route.distance / 1000,
    duration_min,
    duration_in_traffic_min: typical ?? duration_min,
    source: "mapbox",
    steps: extractSteps(route),
  };
}

/** @deprecated Use fetchMapboxDirections */
export async function fetchGoogleDirections(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  waypoints?: { lat: number; lng: number }[],
): Promise<DrivingRoute | null> {
  return fetchMapboxDirections(from, to, waypoints);
}

export async function fetchDistanceMatrix(
  origins: { lat: number; lng: number }[],
  destinations: { lat: number; lng: number }[],
  _mode: "driving" | "bicycling" = "driving",
): Promise<MatrixElement[][]> {
  if (!origins.length || !destinations.length) return [];

  const token = getMapboxAccessToken();
  if (!token) {
    return origins.map((o) =>
      destinations.map((d) => ({
        status: "OK",
        distance_km: haversineKm(o, d),
        duration_min: (haversineKm(o, d) / 30) * 60,
      })),
    );
  }

  // Mapbox Matrix: coordinates = origins then destinations; sources/destinations are indices
  const all = [...origins, ...destinations];
  const coordStr = all.map((p) => `${p.lng},${p.lat}`).join(";");
  const sources = origins.map((_, i) => i).join(";");
  const destIdx = destinations.map((_, i) => origins.length + i).join(";");

  try {
    const json = await mapboxGet<{
      code?: string;
      durations?: (number | null)[][];
      distances?: (number | null)[][];
    }>(`/directions-matrix/v1/mapbox/driving/${coordStr}`, {
      sources,
      destinations: destIdx,
      annotations: "duration,distance",
    });

    if (json.code && json.code !== "Ok") throw new Error(json.code);

    return (json.durations ?? []).map((row, i) =>
      row.map((dur, j) => {
        const dist = json.distances?.[i]?.[j];
        if (dur == null || dist == null) {
          return { status: "ZERO_RESULTS", distance_km: 0, duration_min: 0 };
        }
        return {
          status: "OK",
          distance_km: dist / 1000,
          duration_min: dur / 60,
          duration_in_traffic_min: dur / 60,
        };
      }),
    );
  } catch (err) {
    console.warn("[Mapbox] Matrix failed, using haversine:", err);
    return origins.map((o) =>
      destinations.map((d) => ({
        status: "OK",
        distance_km: haversineKm(o, d),
        duration_min: (haversineKm(o, d) / 30) * 60,
      })),
    );
  }
}

/** Snap raw GPS onto roads via Map Matching API. */
export async function snapToRoads(
  points: { lat: number; lng: number }[],
): Promise<{ lat: number; lng: number }[]> {
  const token = getMapboxAccessToken();
  if (!token || points.length === 0) return points;
  if (points.length === 1) return points;

  const coordStr = points.map((p) => `${p.lng},${p.lat}`).join(";");
  try {
    const json = await mapboxGet<{
      code?: string;
      matchings?: {
        geometry?: { coordinates: [number, number][] };
      }[];
      tracepoints?: ({ location?: [number, number] } | null)[];
    }>(`/matching/v5/mapbox/driving/${coordStr}`, {
      geometries: "geojson",
      overview: "full",
      tidy: "true",
    });

    if (json.tracepoints?.length) {
      const snapped = json.tracepoints
        .filter((t): t is { location: [number, number] } => !!t?.location)
        .map((t) => ({ lng: t.location[0], lat: t.location[1] }));
      if (snapped.length) return snapped;
    }

    const geom = json.matchings?.[0]?.geometry?.coordinates;
    if (geom?.length) {
      return geom.map(([lng, lat]) => ({ lat, lng }));
    }
  } catch (err) {
    console.warn("[Mapbox] Map matching failed:", err);
  }
  return points;
}

async function fetchOsrmRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<DrivingRoute | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const json = (await res.json()) as {
      routes?: {
        distance: number;
        duration: number;
        geometry?: { coordinates: [number, number][] };
      }[];
    };
    const route = json.routes?.[0];
    if (!route?.geometry?.coordinates?.length) return null;
    return {
      coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]),
      distance_km: route.distance / 1000,
      duration_min: route.duration / 60,
      source: "osrm",
    };
  } catch {
    return null;
  }
}

export async function fetchDrivingDistanceKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<{ distanceKm: number; source: "mapbox" | "osrm" | "haversine" }> {
  if (getMapboxAccessToken()) {
    try {
      const route = await fetchMapboxDirections(from, to);
      if (route) return { distanceKm: route.distance_km, source: "mapbox" };
    } catch (err) {
      console.warn("[Mapbox] Directions failed, falling back to OSRM:", err);
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

  return { distanceKm: haversineKm(from, to), source: "haversine" };
}

export async function fetchDrivingRouteWithFallback(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  waypoints?: { lat: number; lng: number }[],
): Promise<DrivingRoute | null> {
  if (getMapboxAccessToken()) {
    try {
      const route = await fetchMapboxDirections(from, to, waypoints);
      if (route) return route;
    } catch (err) {
      console.warn("[Mapbox] Directions failed:", err);
    }
  }
  if (!waypoints?.length) {
    return fetchOsrmRoute(from, to);
  }
  return null;
}
