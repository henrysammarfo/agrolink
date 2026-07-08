import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { toast } from "sonner";
import {
  fetchPlaceSuggestions,
  resolvePlace,
  reverseGeocode,
  type MapLocation,
  type PlaceSuggestion,
} from "@/lib/api/maps";
import { getCurrentPosition } from "@/lib/native-geolocation";

export type { MapLocation };

type Props = {
  value: MapLocation;
  onChange: (location: MapLocation) => void;
  placeholder?: string;
  quickPicks?: MapLocation[];
};

export function LocationPicker({ value, onChange, placeholder, quickPicks }: Props) {
  const [query, setQuery] = useState(value.name);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value.name);
  }, [value.name]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const text = query.trim();
    if (text.length < 2 || text === value.name) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await fetchPlaceSuggestions(text);
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [query, value.name]);

  const pickSuggestion = async (suggestion: PlaceSuggestion) => {
    setLoading(true);
    try {
      const loc = await resolvePlace(suggestion.placeId);
      onChange(loc);
      setQuery(loc.name);
      setOpen(false);
      setSuggestions([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resolve address");
    } finally {
      setLoading(false);
    }
  };

  const useMyLocation = async () => {
    setGpsLoading(true);
    try {
      const pos = await getCurrentPosition();
      if (!pos) {
        toast.error("Location unavailable", { description: "Allow location access in your browser." });
        return;
      }
      const loc = await reverseGeocode(pos.lat, pos.lng);
      onChange(loc);
      setQuery(loc.name);
      setOpen(false);
      toast.success("Location set from GPS");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not use your location");
    } finally {
      setGpsLoading(false);
    }
  };

  return (
    <div ref={wrapRef} className="space-y-2">
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder ?? "Search address in Ghana…"}
          className="block w-full rounded-xl border border-border bg-card py-3 pl-9 pr-10 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary"
          autoComplete="street-address"
        />
        {(loading || gpsLoading) && (
          <Loader2 className="absolute right-3 top-3.5 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {open && suggestions.length > 0 && (
          <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
            {suggestions.map((s) => (
              <li key={s.placeId}>
                <button
                  type="button"
                  onClick={() => void pickSuggestion(s)}
                  className="flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left text-sm hover:bg-secondary"
                >
                  <span className="font-medium">{s.mainText}</span>
                  <span className="text-xs text-muted-foreground line-clamp-1">{s.description}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={() => void useMyLocation()}
        disabled={gpsLoading}
        className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-50"
      >
        <Navigation className="h-3.5 w-3.5" />
        Use my location
      </button>

      {quickPicks && quickPicks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {quickPicks.map((pick) => (
            <button
              key={pick.name}
              type="button"
              onClick={() => {
                onChange(pick);
                setQuery(pick.name);
              }}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                value.lat === pick.lat && value.lng === pick.lng
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background hover:bg-secondary"
              }`}
            >
              {pick.name.split(",")[0]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
