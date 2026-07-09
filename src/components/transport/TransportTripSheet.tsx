import { ChevronRight, MapPin, MessageCircle, Navigation, Phone, Zap } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SlideToConfirm } from "@/components/ui/SlideToConfirm";
import { estimateDriverPayout } from "@/lib/route-display";
import type { DeliveryRow } from "@/lib/types/marketplace";

type Props = {
  job: DeliveryRow;
  active: boolean;
  online: boolean;
  etaMin?: number;
  distanceKm?: number;
  vehicleLabel: string;
  slideLabel?: string | null;
  jobsError?: string | null;
  onAdvance: () => void;
  onMessage: () => void;
  onCall?: () => void;
};

export function TransportTripSheet({
  job,
  active,
  online,
  etaMin,
  distanceKm,
  vehicleLabel,
  slideLabel,
  jobsError,
  onAdvance,
  onMessage,
  onCall,
}: Props) {
  const payout = estimateDriverPayout(job);
  const statusLine = active
    ? etaMin != null
      ? `Arriving in ~${Math.max(1, Math.round(etaMin))} min`
      : "En route"
    : online
      ? "New delivery offer"
      : "Go live to receive offers";

  return (
    <div className="pointer-events-auto mx-auto max-w-lg overflow-hidden rounded-t-3xl border border-border/80 bg-background shadow-2xl">
      <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" />

      {jobsError && (
        <div className="mx-4 mt-3 rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          {jobsError} — showing cached trips. Pull to refresh from job board.
        </div>
      )}

      <div className="flex items-start justify-between gap-3 p-4 pb-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1 font-sans text-lg font-bold tracking-tight">
            {statusLine}
            {active && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {vehicleLabel} · {job.pickup_address?.split(",")[0] ?? "Pickup"} → {job.delivery_address?.split(",")[0] ?? "Dropoff"}
          </p>
        </div>
        {payout != null && (
          <div className="shrink-0 rounded-xl bg-primary/10 px-3 py-2 text-right">
            <div className="font-sans text-xl font-bold text-primary">GHS {Math.round(payout)}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Payout</div>
          </div>
        )}
      </div>

      <div className="space-y-2 px-4 pb-2 text-sm">
        <p className="flex items-start gap-2 text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <span>
            <span className="text-xs uppercase tracking-wide text-muted-foreground/80">Pickup</span>
            <br />
            <span className="text-foreground">{job.pickup_address}</span>
          </span>
        </p>
        <p className="flex items-start gap-2 text-muted-foreground">
          <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>
            <span className="text-xs uppercase tracking-wide text-muted-foreground/80">Dropoff</span>
            <br />
            <span className="text-foreground">{job.delivery_address}</span>
          </span>
        </p>
        {(distanceKm != null || etaMin != null) && (
          <p className="text-xs text-muted-foreground">
            {distanceKm != null && `${distanceKm.toFixed(1)} km`}
            {distanceKm != null && etaMin != null && " · "}
            {etaMin != null && `~${Math.round(etaMin)} min`}
          </p>
        )}
      </div>

      <div className="border-t border-border/60 p-4">
        {slideLabel ? (
          <SlideToConfirm
            label={slideLabel}
            tone={job.status === "enroute_delivery" ? "blue" : "primary"}
            onConfirm={onAdvance}
          />
        ) : active ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onAdvance}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              <Zap className="h-4 w-4" /> Update status
            </button>
            {onCall && (
              <button
                type="button"
                onClick={onCall}
                className="grid h-12 w-12 place-items-center rounded-full bg-foreground text-background"
                aria-label="Call buyer"
              >
                <Phone className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onMessage}
              className="grid h-12 w-12 place-items-center rounded-full border border-border"
              aria-label="Message buyer"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {online ? "Accept from the popup or job board." : "Enable GPS and tap Go live."}
            </p>
            <Link
              to="/app/transport/jobs"
              className="shrink-0 rounded-full border border-border px-4 py-2 text-xs font-medium"
            >
              Job board
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
