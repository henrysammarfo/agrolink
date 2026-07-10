import { useEffect, useRef, useState } from "react";
import { Flag, Loader2, MapPin, Navigation, User, X } from "lucide-react";
import { toast } from "sonner";
import {
  fetchPlaceSuggestions,
  resolvePlace,
  reverseGeocode,
  type MapLocation,
  type PlaceSuggestion,
} from "@/lib/api/maps";
import { getCurrentPosition } from "@/lib/native-geolocation";

type Props = {
  open: boolean;
  onClose: () => void;
  pickupLabel: string;
  value: MapLocation;
  onChange: (loc: MapLocation) => void;
  recentPicks?: MapLocation[];
};

export function LocationSearchSheet({
  open,
  onClose,
  pickupLabel,
  value,
  onChange,
  recentPicks = [],
}: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSuggestions([]);
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        setSuggestions(await fetchPlaceSuggestions(text));
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [query]);

  const pick = async (suggestion: PlaceSuggestion) => {
    setLoading(true);
    try {
      const loc = await resolvePlace(suggestion.placeId);
      onChange(loc);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resolve address");
    } finally {
      setLoading(false);
    }
  };

  const useGps = async () => {
    setLoading(true);
    try {
      const pos = await getCurrentPosition();
      if (!pos) {
        toast.error("Turn on location to use GPS");
        return;
      }
      const loc = await reverseGeocode(pos.lat, pos.lng);
      onChange(loc);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "GPS failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const showRecents = query.trim().length < 2;

  return (
    <div className="fixed inset-0 z-[10080] flex flex-col bg-background">
      <div className="border-b border-border px-4 pb-3 pt-[max(env(safe-area-inset-top),12px)]">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-border" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium">Delivery address</span>
          <div className="w-9" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-start gap-3 border-b border-border px-3 py-3">
            <User className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">From farm</p>
              <p className="truncate text-sm font-medium">{pickupLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 py-3">
            <Flag className="h-4 w-4 shrink-0 text-primary" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Where to?"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        </div>

        {value.name && query.length === 0 && (
          <p className="mt-2 truncate px-1 text-xs text-muted-foreground">
            Current: {value.name}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2">
        {showRecents && (
          <>
            <button
              type="button"
              onClick={() => void useGps()}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-muted/60"
            >
              <Navigation className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Your location</p>
                <p className="text-xs text-muted-foreground">Deliver to your GPS position</p>
              </div>
            </button>
            {recentPicks.map((pick) => (
              <button
                key={pick.name}
                type="button"
                onClick={() => {
                  onChange(pick);
                  onClose();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-muted/60"
              >
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{pick.name.split(",")[0]}</p>
                  <p className="truncate text-xs text-muted-foreground">{pick.name}</p>
                </div>
              </button>
            ))}
          </>
        )}
        {suggestions.map((s) => (
          <button
            key={s.placeId}
            type="button"
            onClick={() => void pick(s)}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-muted/60"
          >
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-medium">{s.mainText}</p>
              <p className="truncate text-xs text-muted-foreground">{s.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
