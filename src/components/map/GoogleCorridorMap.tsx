import { useEffect, useRef } from "react";
import { ACCRA_CENTER, DEFAULT_MAP_ZOOM, GHANA_BOUNDS, GHANA_CENTER, GHANA_MIN_ZOOM, GHANA_NE, GHANA_OVERVIEW_ZOOM, GHANA_SW, isValidMapCoord, STREET_ZOOM } from "@/lib/map-coords";
import {
  GOOGLE_MAP_DARK_STYLES,
  GOOGLE_MAP_LIGHT_STYLES,
  loadGoogleMaps,
} from "@/lib/google-maps-client";
import type { RouteSegment } from "@/lib/route-display";

type Pin = { lat: number; lng: number; label: string; kind?: "farm" | "buyer" | "hub" | "driver" };

type Props = {
  pins: Pin[];
  route?: [number, number][];
  routeSegments?: RouteSegment[];
  className?: string;
  center?: [number, number];
  zoom?: number;
  height?: string;
  animateDriver?: boolean;
  driverLabel?: string;
  driverPosition?: { lat: number; lng: number } | null;
  onProgress?: (fraction: number) => void;
  dark?: boolean;
  fitKey?: string;
  etaLabel?: string;
  priceLabel?: string;
  onLoadError?: () => void;
};

const COLORS: Record<NonNullable<Pin["kind"]>, string> = {
  farm: "#ef4444",
  buyer: "#0b3d2e",
  hub: "#0b3d2e",
  driver: "#22c55e",
};

function validPins(pins: Pin[]) {
  return pins.filter((p) => isValidMapCoord(p.lat, p.lng));
}

export function GoogleCorridorMap({
  pins,
  route,
  routeSegments,
  className = "",
  center,
  zoom,
  height = "100%",
  animateDriver,
  driverLabel = "Driver",
  driverPosition,
  onProgress,
  dark = false,
  fitKey,
  etaLabel,
  priceLabel,
  onLoadError,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const layersRef = useRef<{
    markers: google.maps.Marker[];
    polylines: google.maps.Polyline[];
    driverMarker: google.maps.Marker | null;
    overlays: google.maps.Marker[];
  }>({ markers: [], polylines: [], driverMarker: null, overlays: [] });
  const rafRef = useRef<number | null>(null);
  const lastFitKey = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    let cancelled = false;

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !ref.current) return;
        const initialCenter = center ?? ACCRA_CENTER;
        mapRef.current = new google.maps.Map(ref.current, {
          center: { lat: initialCenter[0], lng: initialCenter[1] },
          zoom: zoom ?? DEFAULT_MAP_ZOOM,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
          gestureHandling: "greedy",
          styles: dark ? GOOGLE_MAP_DARK_STYLES : GOOGLE_MAP_LIGHT_STYLES,
          clickableIcons: false,
          minZoom: GHANA_MIN_ZOOM,
          restriction: {
            latLngBounds: {
              north: GHANA_BOUNDS.north,
              south: GHANA_BOUNDS.south,
              east: GHANA_BOUNDS.east,
              west: GHANA_BOUNDS.west,
            },
            strictBounds: false,
          },
        });
      })
      .catch((err) => {
        console.warn("[GoogleCorridorMap] init failed:", err);
        onLoadError?.();
      });

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setOptions({ styles: dark ? GOOGLE_MAP_DARK_STYLES : GOOGLE_MAP_LIGHT_STYLES });
  }, [dark]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layers = layersRef.current;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    layers.markers.forEach((m) => m.setMap(null));
    layers.polylines.forEach((p) => p.setMap(null));
    layers.overlays.forEach((m) => m.setMap(null));
    layers.driverMarker?.setMap(null);
    layers.markers = [];
    layers.polylines = [];
    layers.overlays = [];
    layers.driverMarker = null;

    const safePins = validPins(pins);
    safePins.forEach((p) => {
      const color = COLORS[p.kind ?? "farm"];
      const marker = new google.maps.Marker({
        map,
        position: { lat: p.lat, lng: p.lng },
        title: p.label,
        icon: {
          url: `data:image/svg+xml,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><circle cx="14" cy="14" r="12" fill="${color}" stroke="#fff" stroke-width="2"/></svg>`,
          )}`,
          scaledSize: new google.maps.Size(28, 28),
          anchor: new google.maps.Point(14, 14),
        },
      });
      layers.markers.push(marker);
    });

    const segments =
      routeSegments?.length
        ? routeSegments
        : route?.filter(([lat, lng]) => isValidMapCoord(lat, lng)).length
          ? [{ coordinates: route!.filter(([lat, lng]) => isValidMapCoord(lat, lng)), color: "#22c55e" }]
          : [];

    for (const seg of segments) {
      if (seg.coordinates.length < 2) continue;
      const path = seg.coordinates.map(([lat, lng]) => ({ lat, lng }));
      layers.polylines.push(
        new google.maps.Polyline({
          map,
          path,
          strokeColor: seg.color,
          strokeOpacity: 0.95,
          strokeWeight: 6,
          geodesic: true,
        }),
      );
      layers.polylines.push(
        new google.maps.Polyline({
          map,
          path,
          strokeColor: "#ffffff",
          strokeOpacity: 0.35,
          strokeWeight: 2,
          geodesic: true,
        }),
      );
    }

    const allRouteCoords = segments.flatMap((s) => s.coordinates);

    if (driverPosition && isValidMapCoord(driverPosition.lat, driverPosition.lng)) {
      layers.driverMarker = new google.maps.Marker({
        map,
        position: driverPosition,
        title: driverLabel,
        icon: {
          url: `data:image/svg+xml,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><rect x="6" y="12" width="24" height="14" rx="4" fill="#22c55e"/><circle cx="11" cy="28" r="3" fill="#111"/><circle cx="25" cy="28" r="3" fill="#111"/></svg>`,
          )}`,
          scaledSize: new google.maps.Size(36, 36),
          anchor: new google.maps.Point(18, 18),
        },
        zIndex: 1000,
      });
    } else if (animateDriver && allRouteCoords.length > 1) {
      const marker = new google.maps.Marker({
        map,
        position: { lat: allRouteCoords[0][0], lng: allRouteCoords[0][1] },
        icon: {
          url: `data:image/svg+xml,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><rect x="6" y="12" width="24" height="14" rx="4" fill="#22c55e"/><circle cx="11" cy="28" r="3" fill="#111"/><circle cx="25" cy="28" r="3" fill="#111"/></svg>`,
          )}`,
          scaledSize: new google.maps.Size(36, 36),
          anchor: new google.maps.Point(18, 18),
        },
      });
      layers.driverMarker = marker;

      const segs = allRouteCoords.slice(1).map((pt, i) => {
        const [a, b] = [allRouteCoords[i], pt];
        return Math.hypot(b[0] - a[0], b[1] - a[1]);
      });
      const total = segs.reduce((s, x) => s + x, 0);
      const duration = 22000;
      const start = performance.now();
      const tick = (now: number) => {
        const t = ((now - start) % duration) / duration;
        let dist = t * total;
        let i = 0;
        while (i < segs.length && dist > segs[i]) {
          dist -= segs[i];
          i++;
        }
        const [a, b] = [allRouteCoords[i], allRouteCoords[Math.min(i + 1, allRouteCoords.length - 1)]];
        const f = segs[i] ? dist / segs[i] : 0;
        marker.setPosition({
          lat: a[0] + (b[0] - a[0]) * f,
          lng: a[1] + (b[1] - a[1]) * f,
        });
        onProgress?.(t);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }

    if (etaLabel && allRouteCoords.length > 0) {
      const dest = allRouteCoords[allRouteCoords.length - 1];
      layers.overlays.push(
        new google.maps.Marker({
          map,
          position: { lat: dest[0], lng: dest[1] },
          clickable: false,
          icon: {
            url: `data:image/svg+xml,${encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="32"><rect width="120" height="32" rx="10" fill="#ef4444"/><text x="60" y="21" text-anchor="middle" fill="#fff" font-family="Inter,sans-serif" font-size="12" font-weight="700">${etaLabel}</text></svg>`,
            )}`,
            anchor: new google.maps.Point(-8, 20),
          },
        }),
      );
    }

    if (priceLabel && !driverPosition) {
      const anchor = center && isValidMapCoord(center[0], center[1]) ? center : ACCRA_CENTER;
      layers.overlays.push(
        new google.maps.Marker({
          map,
          position: { lat: anchor[0] + 0.006, lng: anchor[1] + 0.01 },
          clickable: false,
          icon: {
            url: `data:image/svg+xml,${encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="36"><rect width="100" height="36" rx="18" fill="#ef4444"/><text x="50" y="23" text-anchor="middle" fill="#fff" font-family="Inter,sans-serif" font-size="13" font-weight="700">${priceLabel}</text></svg>`,
            )}`,
            anchor: new google.maps.Point(0, 0),
          },
        }),
      );
    }

    const shouldFit = fitKey !== lastFitKey.current;
    if (shouldFit) lastFitKey.current = fitKey;

    const fitPoints: google.maps.LatLngLiteral[] = [
      ...safePins.map((p) => ({ lat: p.lat, lng: p.lng })),
      ...allRouteCoords.map(([lat, lng]) => ({ lat, lng })),
    ];
    if (driverPosition && isValidMapCoord(driverPosition.lat, driverPosition.lng)) {
      fitPoints.push(driverPosition);
    }

    if (shouldFit && fitPoints.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      fitPoints.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, { top: 120, right: 56, bottom: 280, left: 56 });
      const listener = google.maps.event.addListenerOnce(map, "idle", () => {
        const z = map.getZoom();
        if (z != null && z > STREET_ZOOM) map.setZoom(STREET_ZOOM);
        if (z != null && z < 10) map.setZoom(10);
      });
      void listener;
    } else if (shouldFit && center && isValidMapCoord(center[0], center[1])) {
      map.setCenter({ lat: center[0], lng: center[1] });
      map.setZoom(Math.max(zoom ?? STREET_ZOOM, 11));
    } else if (shouldFit) {
      map.fitBounds(
        new google.maps.LatLngBounds(
          { lat: GHANA_BOUNDS.south, lng: GHANA_BOUNDS.west },
          { lat: GHANA_BOUNDS.north, lng: GHANA_BOUNDS.east },
        ),
        40,
      );
      map.setZoom(GHANA_OVERVIEW_ZOOM);
    }
  }, [pins, route, routeSegments, fitKey, animateDriver, driverLabel, onProgress, etaLabel, priceLabel, center, zoom]);

  useEffect(() => {
    const layers = layersRef.current;
    if (!mapRef.current || !driverPosition || !isValidMapCoord(driverPosition.lat, driverPosition.lng)) {
      return;
    }

    if (layers.driverMarker) {
      layers.driverMarker.setPosition(driverPosition);
    } else {
      layers.driverMarker = new google.maps.Marker({
        map: mapRef.current,
        position: driverPosition,
        title: driverLabel,
        icon: {
          url: `data:image/svg+xml,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><rect x="6" y="12" width="24" height="14" rx="4" fill="#22c55e"/><circle cx="11" cy="28" r="3" fill="#111"/><circle cx="25" cy="28" r="3" fill="#111"/></svg>`,
          )}`,
          scaledSize: new google.maps.Size(36, 36),
          anchor: new google.maps.Point(18, 18),
        },
        zIndex: 1000,
      });
    }
  }, [driverPosition?.lat, driverPosition?.lng, driverLabel]);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ height, width: "100%" }}>
      <div ref={ref} className="absolute inset-0" />
      {priceLabel && driverPosition && (
        <div className="pointer-events-none absolute right-3 top-3 z-[500] rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-lg">
          {priceLabel}
        </div>
      )}
    </div>
  );
}
