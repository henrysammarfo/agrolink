import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { ACCRA_CENTER, DEFAULT_MAP_ZOOM, isValidMapCoord, STREET_ZOOM } from "@/lib/map-coords";
import { getGoogleMapsClientKey } from "@/lib/google-maps-client";
import { DRIVER_CAR_ICON_ANCHOR, DRIVER_CAR_ICON_HTML, DRIVER_CAR_ICON_SIZE } from "@/lib/map-icons";
import { GoogleCorridorMap } from "@/components/map/GoogleCorridorMap";
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
  /** Only refit map bounds when this key changes (e.g. job id). */
  fitKey?: string;
  etaLabel?: string;
  priceLabel?: string;
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

export function CorridorMap(props: Props) {
  const [googleFailed, setGoogleFailed] = useState(false);

  if (getGoogleMapsClientKey() && !googleFailed) {
    return <GoogleCorridorMap {...props} onLoadError={() => setGoogleFailed(true)} />;
  }
  return <LeafletCorridorMap {...props} />;
}

function LeafletCorridorMap({
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
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    markers: L.Marker[];
    routeLines: L.Polyline[];
    driverMarker: L.Marker | null;
    overlays: L.Marker[];
  }>({ markers: [], routeLines: [], driverMarker: null, overlays: [] });
  const rafRef = useRef<number | null>(null);
  const lastFitKey = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const initialCenter = center ?? ACCRA_CENTER;
    const map = L.map(ref.current, {
      zoomControl: false,
      scrollWheelZoom: true,
      attributionControl: false,
    }).setView(initialCenter, zoom ?? DEFAULT_MAP_ZOOM);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 120);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const tileUrl = dark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) map.removeLayer(layer);
    });
    L.tileLayer(tileUrl, { maxZoom: 19, subdomains: "abcd" }).addTo(map);
  }, [dark]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layers = layersRef.current;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    layers.markers.forEach((m) => m.remove());
    layers.routeLines.forEach((l) => l.remove());
    layers.overlays.forEach((m) => m.remove());
    layers.driverMarker?.remove();
    layers.markers = [];
    layers.routeLines = [];
    layers.overlays = [];
    layers.driverMarker = null;

    const safePins = validPins(pins);

    safePins.forEach((p) => {
      const color = COLORS[p.kind ?? "farm"];
      const icon = L.divIcon({
        html: `<span style="display:grid;place-items:center;width:28px;height:28px;border-radius:9999px;background:${color};color:#fff;font:700 11px Inter,sans-serif;box-shadow:0 4px 14px ${color}66">●</span>`,
        className: "",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      layers.markers.push(
        L.marker([p.lat, p.lng], { icon })
          .bindTooltip(p.label, { direction: "top", offset: [0, -10] })
          .addTo(map),
      );
    });

    const segments =
      routeSegments?.length
        ? routeSegments
        : route?.filter(([lat, lng]) => isValidMapCoord(lat, lng)).length
          ? [{ coordinates: route!.filter(([lat, lng]) => isValidMapCoord(lat, lng)), color: "#22c55e" }]
          : [];

    for (const seg of segments) {
      if (seg.coordinates.length < 2) continue;
      layers.routeLines.push(
        L.polyline(seg.coordinates, {
          color: seg.color,
          weight: 6,
          opacity: 0.95,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map),
      );
      layers.routeLines.push(
        L.polyline(seg.coordinates, {
          color: "#ffffff",
          weight: 2,
          opacity: 0.35,
        }).addTo(map),
      );
    }

    const allRouteCoords = segments.flatMap((s) => s.coordinates);

    if (driverPosition && isValidMapCoord(driverPosition.lat, driverPosition.lng)) {
      const driverIcon = L.divIcon({
        html: DRIVER_CAR_ICON_HTML,
        className: "agrolink-driver-marker",
        iconSize: DRIVER_CAR_ICON_SIZE,
        iconAnchor: DRIVER_CAR_ICON_ANCHOR,
      });
      layers.driverMarker = L.marker([driverPosition.lat, driverPosition.lng], { icon: driverIcon, zIndexOffset: 1000 })
        .bindTooltip(driverLabel, { direction: "top", offset: [0, -18] })
        .addTo(map);
    } else if (animateDriver && allRouteCoords.length > 1) {
      const driverIcon = L.divIcon({
        html: DRIVER_CAR_ICON_HTML,
        className: "agrolink-driver-marker",
        iconSize: DRIVER_CAR_ICON_SIZE,
        iconAnchor: DRIVER_CAR_ICON_ANCHOR,
      });
      const marker = L.marker(allRouteCoords[0], { icon: driverIcon }).addTo(map);
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
        marker.setLatLng([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
        onProgress?.(t);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }

    if (etaLabel && allRouteCoords.length > 0) {
      const dest = allRouteCoords[allRouteCoords.length - 1];
      const etaIcon = L.divIcon({
        html: `<div style="background:#ef4444;color:#fff;font:700 12px Inter,sans-serif;padding:6px 10px;border-radius:10px;box-shadow:0 4px 16px rgba(239,68,68,.45);white-space:nowrap">${etaLabel}</div>`,
        className: "",
        iconSize: [0, 0],
        iconAnchor: [-8, 20],
      });
      layers.overlays.push(L.marker(dest, { icon: etaIcon, interactive: false }).addTo(map));
    }

    if (priceLabel && !driverPosition) {
      const priceIcon = L.divIcon({
        html: `<div style="background:#ef4444;color:#fff;font:700 13px Inter,sans-serif;padding:8px 12px;border-radius:9999px;box-shadow:0 4px 16px rgba(239,68,68,.4)">${priceLabel}</div>`,
        className: "",
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      const anchor = center && isValidMapCoord(center[0], center[1]) ? center : ACCRA_CENTER;
      layers.overlays.push(
        L.marker([anchor[0] + 0.006, anchor[1] + 0.01], { icon: priceIcon, interactive: false }).addTo(map),
      );
    }

    const shouldFit = fitKey !== lastFitKey.current;
    if (shouldFit) lastFitKey.current = fitKey;

    const fitPoints: [number, number][] = [
      ...safePins.map((p) => [p.lat, p.lng] as [number, number]),
      ...allRouteCoords,
    ];
    if (driverPosition && isValidMapCoord(driverPosition.lat, driverPosition.lng)) {
      fitPoints.push([driverPosition.lat, driverPosition.lng]);
    }

    if (shouldFit && fitPoints.length > 0) {
      map.fitBounds(L.latLngBounds(fitPoints), { padding: [56, 56], maxZoom: STREET_ZOOM });
    } else if (shouldFit && center && isValidMapCoord(center[0], center[1])) {
      map.setView(center, zoom ?? STREET_ZOOM);
    } else if (shouldFit) {
      map.setView(ACCRA_CENTER, DEFAULT_MAP_ZOOM);
    }

    setTimeout(() => map.invalidateSize(), 80);
  }, [pins, route, routeSegments, fitKey, animateDriver, driverLabel, onProgress, etaLabel, priceLabel, center, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    const layers = layersRef.current;
    if (!map || !driverPosition || !isValidMapCoord(driverPosition.lat, driverPosition.lng)) return;

    if (layers.driverMarker) {
      layers.driverMarker.setLatLng([driverPosition.lat, driverPosition.lng]);
    } else {
      const driverIcon = L.divIcon({
        html: DRIVER_CAR_ICON_HTML,
        className: "agrolink-driver-marker",
        iconSize: DRIVER_CAR_ICON_SIZE,
        iconAnchor: DRIVER_CAR_ICON_ANCHOR,
      });
      layers.driverMarker = L.marker([driverPosition.lat, driverPosition.lng], { icon: driverIcon, zIndexOffset: 1000 })
        .bindTooltip(driverLabel, { direction: "top", offset: [0, -18] })
        .addTo(map);
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

export const CORRIDOR_PINS: Pin[] = [
  { lat: 5.7956, lng: 0.6347, label: "Ada Foah", kind: "farm" },
  { lat: 5.8810, lng: 0.1030, label: "Dodowa", kind: "farm" },
  { lat: 5.7710, lng: 0.0760, label: "Afienya", kind: "farm" },
  { lat: 5.6698, lng: 0.0166, label: "Tema (Buyer hub)", kind: "hub" },
  { lat: 5.5560, lng: -0.2207, label: "Agbogbloshie", kind: "hub" },
  { lat: 5.6500, lng: -0.1650, label: "East Legon", kind: "buyer" },
];

export const CORRIDOR_ROUTE: [number, number][] = [
  [5.7956, 0.6347], [5.8810, 0.1030], [5.7710, 0.0760], [5.6698, 0.0166], [5.6500, -0.1650], [5.5560, -0.2207],
];

export const TRACK_PINS: Pin[] = [
  { lat: 5.8810, lng: 0.1030, label: "Kwame · Dodowa Farm", kind: "farm" },
  { lat: 5.6500, lng: -0.1650, label: "You · East Legon", kind: "buyer" },
];

export const TRACK_ROUTE: [number, number][] = [
  [5.8810, 0.1030], [5.7710, 0.0760], [5.6698, 0.0166], [5.6500, -0.1650],
];
