import { useEffect, useRef, useState } from "react";
import { ExternalLink, Volume2, VolumeX } from "lucide-react";
import type { RouteStep } from "@/lib/api/maps";

type Props = {
  destinationLabel: string;
  distanceKm?: number;
  durationMin?: number;
  durationInTrafficMin?: number;
  routeSource?: "mapbox" | "osrm" | "haversine";
  destination: { lat: number; lng: number };
  currentPosition?: { lat: number; lng: number } | null;
  steps?: RouteStep[];
  enabled?: boolean;
  muted?: boolean;
  onToggleMute?: () => void;
  /** When active trip, sit above bottom sheet instead of top */
  placement?: "top" | "above-sheet";
};

function haversineM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.95;
  window.speechSynthesis.speak(utter);
}

export function DriverNavHud({
  destinationLabel,
  distanceKm,
  durationMin,
  durationInTrafficMin,
  routeSource,
  destination,
  currentPosition,
  steps = [],
  enabled = true,
  muted = false,
  onToggleMute,
  placement = "top",
}: Props) {
  const spokeStartRef = useRef(false);
  const stepIndexRef = useRef(0);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    spokeStartRef.current = false;
    stepIndexRef.current = 0;
    setActiveStep(0);
  }, [destination.lat, destination.lng, steps.length]);

  useEffect(() => {
    if (!enabled || muted || spokeStartRef.current) return;
    spokeStartRef.current = true;
    const first = steps[0]?.instruction;
    speak(
      first
        ? `Navigation started. ${first}`
        : `Navigation started. Head to ${destinationLabel}.${distanceKm ? ` About ${distanceKm.toFixed(1)} kilometers.` : ""}`,
    );
    return () => window.speechSynthesis?.cancel();
  }, [enabled, muted, destinationLabel, distanceKm, steps]);

  useEffect(() => {
    if (!enabled || muted || !currentPosition || steps.length === 0) return;

    let idx = stepIndexRef.current;
    while (idx < steps.length - 1) {
      const step = steps[idx];
      const dist = haversineM(currentPosition, { lat: step.end_lat, lng: step.end_lng });
      if (dist > 45) break;
      idx += 1;
    }

    if (idx !== stepIndexRef.current) {
      stepIndexRef.current = idx;
      setActiveStep(idx);
      const next = steps[idx];
      if (next) speak(next.instruction);
    }
  }, [enabled, muted, currentPosition, steps]);

  if (!enabled) return null;

  const currentInstruction = steps[activeStep]?.instruction;
  const etaMin = durationInTrafficMin ?? durationMin;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;

  const placementClass =
    placement === "above-sheet"
      ? "bottom-[calc(var(--agrolink-tab-bar,3.5rem)+env(safe-area-inset-bottom)+14rem)] top-auto"
      : "top-[max(env(safe-area-inset-top),3.5rem)]";

  return (
    <div className={`pointer-events-auto absolute inset-x-3 z-30 mx-auto max-w-md rounded-2xl border border-white/15 bg-black/75 p-3 text-white backdrop-blur-md ${placementClass}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-medium tracking-wide text-white/55">Navigating to</p>
            {routeSource && (
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase ${routeSource === "mapbox" ? "bg-blue-500/30 text-blue-200" : "bg-amber-500/30 text-amber-200"}`}>
                {routeSource}
              </span>
            )}
          </div>
          <p className="truncate font-sans text-sm font-semibold">{destinationLabel}</p>
          {currentInstruction && (
            <p className="mt-1 line-clamp-2 text-xs text-white/85">{currentInstruction}</p>
          )}
          {(distanceKm != null || etaMin != null) && (
            <p className="mt-0.5 text-xs text-white/75">
              {distanceKm != null && `${distanceKm.toFixed(1)} km`}
              {distanceKm != null && etaMin != null && " · "}
              {etaMin != null && `${Math.round(etaMin)} min${durationInTrafficMin ? " (traffic)" : ""}`}
              {steps.length > 0 && ` · step ${activeStep + 1}/${steps.length}`}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-1.5">
          {onToggleMute && (
            <button
              type="button"
              onClick={onToggleMute}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10"
              aria-label={muted ? "Unmute directions" : "Mute directions"}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          )}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Maps
          </a>
        </div>
      </div>
    </div>
  );
}
