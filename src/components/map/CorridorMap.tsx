import { useEffect, useRef } from "react";
import L from "leaflet";

type Pin = { lat: number; lng: number; label: string; kind?: "farm" | "buyer" | "hub" | "driver" };

type Props = {
  pins: Pin[];
  route?: [number, number][];
  className?: string;
  center?: [number, number];
  zoom?: number;
  height?: string;
};

const COLORS: Record<NonNullable<Pin["kind"]>, string> = {
  farm: "#2f7d32",
  buyer: "#c46a1a",
  hub: "#0b3d2e",
  driver: "#1d4ed8",
};

export function CorridorMap({ pins, route, className = "", center = [5.65, 0.05], zoom = 10, height = "100%" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { zoomControl: false, scrollWheelZoom: false, attributionControl: false }).setView(center, zoom);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19, subdomains: "abcd",
    }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    pins.forEach((p) => {
      const color = COLORS[p.kind ?? "farm"];
      const icon = L.divIcon({
        html: `<span style="display:grid;place-items:center;width:22px;height:22px;border-radius:9999px;background:${color};color:#fff;font:600 11px Inter,sans-serif;box-shadow:0 0 0 4px ${color}33">●</span>`,
        className: "",
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      L.marker([p.lat, p.lng], { icon }).bindTooltip(p.label, { direction: "top", offset: [0, -8] }).addTo(map);
    });

    if (route && route.length > 1) {
      L.polyline(route, { color: "#2f7d32", weight: 3, dashArray: "6 6", opacity: 0.8 }).addTo(map);
    }

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
