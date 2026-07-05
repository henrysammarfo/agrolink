import { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";

type Pin = { lat: number; lng: number; label: string; kind?: "farm" | "buyer" | "hub" | "driver" };

type Props = {
  pins: Pin[];
  route?: [number, number][];
  className?: string;
  center?: [number, number];
  zoom?: number;
  height?: string;
  animateDriver?: boolean;
  driverLabel?: string;
  onProgress?: (fraction: number) => void;
  dark?: boolean;
};

const COLORS: Record<NonNullable<Pin["kind"]>, string> = {
  farm: "#2f7d32",
  buyer: "#c46a1a",
  hub: "#0b3d2e",
  driver: "#111827",
};

export function CorridorMap({
  pins,
  route,
  className = "",
  center = [5.65, 0.05],
  zoom = 10,
  height = "100%",
  animateDriver,
  driverLabel = "Driver",
  onProgress,
  dark = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    markers: L.Marker[];
    routeLines: L.Polyline[];
    driverMarker: L.Marker | null;
  }>({ markers: [], routeLines: [], driverMarker: null });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    if (!mapRef.current) {
      const map = L.map(ref.current, {
        zoomControl: false,
        scrollWheelZoom: false,
        attributionControl: false,
      }).setView(center, zoom);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      mapRef.current = map;
    }

    const map = mapRef.current;
    const layers = layersRef.current;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    layers.markers.forEach((m) => m.remove());
    layers.routeLines.forEach((l) => l.remove());
    layers.driverMarker?.remove();
    layers.markers = [];
    layers.routeLines = [];
    layers.driverMarker = null;

    const tileUrl = dark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) map.removeLayer(layer);
    });
    L.tileLayer(tileUrl, { maxZoom: 19, subdomains: "abcd" }).addTo(map);

    pins.forEach((p) => {
      const color = COLORS[p.kind ?? "farm"];
      const icon = L.divIcon({
        html: `<span style="display:grid;place-items:center;width:24px;height:24px;border-radius:9999px;background:${color};color:#fff;font:600 11px Inter,sans-serif;box-shadow:0 0 0 5px ${color}22, 0 6px 16px -8px ${color}">●</span>`,
        className: "",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      const marker = L.marker([p.lat, p.lng], { icon })
        .bindTooltip(p.label, { direction: "top", offset: [0, -10] })
        .addTo(map);
      layers.markers.push(marker);
    });

    if (route && route.length > 1) {
      const main = L.polyline(route, {
        color: dark ? "#22c55e" : "#0b3d2e",
        weight: 4,
        opacity: 0.85,
        lineCap: "round",
      }).addTo(map);
      const dash = L.polyline(route, {
        color: "#ffffff",
        weight: 1.5,
        opacity: 0.5,
        dashArray: "2 8",
      }).addTo(map);
      layers.routeLines.push(main, dash);

      if (animateDriver) {
        const driverIcon = L.divIcon({
          html: `<div style="position:relative">
            <span style="position:absolute;left:-14px;top:-14px;width:44px;height:44px;border-radius:9999px;background:#22c55e33;animation:pulse 2s infinite"></span>
            <span style="position:relative;display:grid;place-items:center;width:34px;height:34px;border-radius:9999px;background:#0b3d2e;color:#fff;font:700 13px Inter,sans-serif;box-shadow:0 8px 24px -6px #0b3d2e">🛻</span>
          </div>
          <style>@keyframes pulse{0%{transform:scale(.6);opacity:.9}100%{transform:scale(1.4);opacity:0}}</style>`,
          className: "",
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });
        const marker = L.marker(route[0], { icon: driverIcon })
          .bindTooltip(driverLabel, { direction: "top", offset: [0, -14] })
          .addTo(map);
        layers.driverMarker = marker;

        const segs = route.slice(1).map((pt, i) => {
          const [a, b] = [route[i], pt];
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
          const [a, b] = [route[i], route[Math.min(i + 1, route.length - 1)]];
          const f = segs[i] ? dist / segs[i] : 0;
          const lat = a[0] + (b[0] - a[0]) * f;
          const lng = a[1] + (b[1] - a[1]) * f;
          marker.setLatLng([lat, lng]);
          onProgress?.(t);
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    if (pins.length > 0) {
      const bounds = L.latLngBounds(pins.map((p) => [p.lat, p.lng] as [number, number]));
      if (route) route.forEach((r) => bounds.extend(r));
      map.fitBounds(bounds, { padding: [30, 30] });
    } else {
      map.setView(center, zoom);
    }
  }, [pins, route, center, zoom, animateDriver, driverLabel, onProgress, dark]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={ref} className={`relative overflow-hidden ${className}`} style={{ height }} />;
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
