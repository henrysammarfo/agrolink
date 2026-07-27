import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, Marker, Source, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  ACCRA_CENTER,
  DEFAULT_MAP_ZOOM,
  GHANA_BOUNDS,
  GHANA_MIN_ZOOM,
  GHANA_OVERVIEW_ZOOM,
  GREATER_ACCRA_BOUNDS,
  GREATER_ACCRA_ZOOM,
  isValidMapCoord,
  STREET_ZOOM,
} from "@/lib/map-coords";
import { getMapboxClientToken, MAPBOX_STYLE_DARK, MAPBOX_STYLE_LIGHT } from "@/lib/mapbox-client";
import { DRIVER_CAR_ICON_HTML } from "@/lib/map-icons";
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
  corridorOnly?: boolean;
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

function toLngLat(lat: number, lng: number): [number, number] {
  return [lng, lat];
}

const GHANA_MAX_BOUNDS: [[number, number], [number, number]] = [
  [GHANA_BOUNDS.west, GHANA_BOUNDS.south],
  [GHANA_BOUNDS.east, GHANA_BOUNDS.north],
];

const GREATER_ACCRA_MAX_BOUNDS: [[number, number], [number, number]] = [
  [GREATER_ACCRA_BOUNDS.west, GREATER_ACCRA_BOUNDS.south],
  [GREATER_ACCRA_BOUNDS.east, GREATER_ACCRA_BOUNDS.north],
];

export function MapboxCorridorMap({
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
  corridorOnly = false,
}: Props) {
  const mapRef = useRef<MapRef>(null);
  const lastFitKey = useRef<string | undefined>(undefined);
  const rafRef = useRef<number | null>(null);
  const [animPos, setAnimPos] = useState<{ lat: number; lng: number } | null>(null);
  const token = getMapboxClientToken();

  const initialCenter = center ?? ACCRA_CENTER;
  const initialViewState = {
    longitude: initialCenter[1],
    latitude: initialCenter[0],
    zoom: zoom ?? DEFAULT_MAP_ZOOM,
  };

  const safePins = useMemo(() => validPins(pins), [pins]);

  const segments = useMemo(() => {
    if (routeSegments?.length) return routeSegments;
    const coords = route?.filter(([lat, lng]) => isValidMapCoord(lat, lng)) ?? [];
    if (coords.length) return [{ coordinates: coords, color: "#22c55e" }];
    return [];
  }, [route, routeSegments]);

  const allRouteCoords = useMemo(
    () => segments.flatMap((s) => s.coordinates),
    [segments],
  );

  const fitBounds = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const shouldFit = fitKey !== lastFitKey.current;
    if (!shouldFit) return;
    lastFitKey.current = fitKey;

    const fitPoints: [number, number][] = [
      ...safePins.map((p) => toLngLat(p.lat, p.lng)),
      ...allRouteCoords.map(([lat, lng]) => toLngLat(lat, lng)),
    ];
    if (driverPosition && isValidMapCoord(driverPosition.lat, driverPosition.lng)) {
      fitPoints.push(toLngLat(driverPosition.lat, driverPosition.lng));
    }

    if (fitPoints.length > 0) {
      const lons = fitPoints.map((p) => p[0]);
      const lats = fitPoints.map((p) => p[1]);
      map.fitBounds(
        [
          [Math.min(...lons), Math.min(...lats)],
          [Math.max(...lons), Math.max(...lats)],
        ],
        {
          padding: { top: 120, bottom: 280, left: 56, right: 56 },
          maxZoom: STREET_ZOOM,
          duration: 600,
        },
      );
    } else if (center && isValidMapCoord(center[0], center[1])) {
      map.flyTo({
        center: toLngLat(center[0], center[1]),
        zoom: Math.max(zoom ?? STREET_ZOOM, corridorOnly ? GREATER_ACCRA_ZOOM : 11),
        duration: 400,
      });
    } else if (corridorOnly) {
      map.fitBounds(GREATER_ACCRA_MAX_BOUNDS, { padding: 40, duration: 400 });
    } else {
      map.fitBounds(GHANA_MAX_BOUNDS, { padding: 40, duration: 400 });
      map.setZoom(GHANA_OVERVIEW_ZOOM);
    }
  }, [fitKey, safePins, allRouteCoords, driverPosition, center, zoom, corridorOnly]);

  useEffect(() => {
    fitBounds();
  }, [fitBounds]);

  useEffect(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (driverPosition || !animateDriver || allRouteCoords.length < 2) {
      setAnimPos(null);
      return;
    }

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
      setAnimPos({
        lat: a[0] + (b[0] - a[0]) * f,
        lng: a[1] + (b[1] - a[1]) * f,
      });
      onProgress?.(t);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animateDriver, allRouteCoords, driverPosition, onProgress]);

  const liveDriver =
    driverPosition && isValidMapCoord(driverPosition.lat, driverPosition.lng)
      ? driverPosition
      : animPos;

  if (!token) return null;

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ height, width: "100%" }}>
      <Map
        ref={mapRef}
        mapboxAccessToken={token}
        initialViewState={initialViewState}
        mapStyle={dark ? MAPBOX_STYLE_DARK : MAPBOX_STYLE_LIGHT}
        style={{ width: "100%", height: "100%" }}
        minZoom={corridorOnly ? GREATER_ACCRA_ZOOM : GHANA_MIN_ZOOM}
        maxBounds={GHANA_MAX_BOUNDS}
        attributionControl={false}
        reuseMaps
        onError={() => onLoadError?.()}
        onLoad={() => {
          lastFitKey.current = undefined;
          fitBounds();
        }}
      >
        {segments.map((seg, idx) => {
          if (seg.coordinates.length < 2) return null;
          const geojson = {
            type: "Feature" as const,
            properties: {},
            geometry: {
              type: "LineString" as const,
              coordinates: seg.coordinates.map(([lat, lng]) => toLngLat(lat, lng)),
            },
          };
          return (
            <Source key={`route-${idx}`} id={`route-${idx}`} type="geojson" data={geojson}>
              <Layer
                id={`route-line-${idx}`}
                type="line"
                paint={{
                  "line-color": seg.color,
                  "line-width": 6,
                  "line-opacity": 0.95,
                }}
                layout={{ "line-cap": "round", "line-join": "round" }}
              />
              <Layer
                id={`route-glow-${idx}`}
                type="line"
                paint={{
                  "line-color": "#ffffff",
                  "line-width": 2,
                  "line-opacity": 0.35,
                }}
              />
            </Source>
          );
        })}

        {safePins.map((p, i) => (
          <Marker key={`pin-${i}`} longitude={p.lng} latitude={p.lat} anchor="center">
            <div
              title={p.label}
              className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold text-white shadow-lg"
              style={{
                background: COLORS[p.kind ?? "farm"],
                boxShadow: `0 4px 14px ${COLORS[p.kind ?? "farm"]}66`,
              }}
            >
              ●
            </div>
          </Marker>
        ))}

        {liveDriver && (
          <Marker longitude={liveDriver.lng} latitude={liveDriver.lat} anchor="center">
            <div
              title={driverLabel}
              className="agrolink-driver-marker"
              dangerouslySetInnerHTML={{ __html: DRIVER_CAR_ICON_HTML }}
            />
          </Marker>
        )}
      </Map>

      {etaLabel && (
        <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-xl bg-black/75 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-sm">
          {etaLabel}
        </div>
      )}
      {priceLabel && (
        <div className="pointer-events-none absolute right-3 top-3 z-[500] rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-lg">
          {priceLabel}
        </div>
      )}
    </div>
  );
}
