import { useEffect, useRef } from "react";
import { ExternalLink, Volume2, VolumeX } from "lucide-react";

type Props = {
  destinationLabel: string;
  distanceKm?: number;
  durationMin?: number;
  destination: { lat: number; lng: number };
  enabled?: boolean;
  muted?: boolean;
  onToggleMute?: () => void;
};

export function DriverNavHud({
  destinationLabel,
  distanceKm,
  durationMin,
  destination,
  enabled = true,
  muted = false,
  onToggleMute,
}: Props) {
  const spokeRef = useRef(false);

  useEffect(() => {
    if (!enabled || muted || spokeRef.current) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    spokeRef.current = true;
    const utter = new SpeechSynthesisUtterance(
      `Navigation started. Head to ${destinationLabel}.${distanceKm ? ` About ${distanceKm.toFixed(1)} kilometers.` : ""}`,
    );
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [enabled, muted, destinationLabel, distanceKm]);

  if (!enabled) return null;

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;

  return (
    <div className="pointer-events-auto absolute inset-x-3 top-[max(env(safe-area-inset-top),3.5rem)] z-30 mx-auto max-w-md rounded-2xl border border-white/15 bg-black/75 p-3 text-white backdrop-blur-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-white/60">Navigating to</p>
          <p className="truncate font-sans text-sm font-semibold">{destinationLabel}</p>
          {(distanceKm != null || durationMin != null) && (
            <p className="mt-0.5 text-xs text-white/75">
              {distanceKm != null && `${distanceKm.toFixed(1)} km`}
              {distanceKm != null && durationMin != null && " · "}
              {durationMin != null && `${Math.round(durationMin)} min`}
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
