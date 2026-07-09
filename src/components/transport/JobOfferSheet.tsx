import { MapPin, Navigation, Truck, X, Check } from "lucide-react";
import { JobAcceptCountdown } from "@/components/transport/JobAcceptCountdown";
import type { DeliveryRow } from "@/lib/types/marketplace";

type Props = {
  job: DeliveryRow;
  onAccept: () => void;
  onDecline: () => void;
  onClose: () => void;
  onExpired: () => void;
  accepting?: boolean;
};

export function JobOfferSheet({ job, onAccept, onDecline, onClose, onExpired, accepting }: Props) {
  const fee = job.delivery_fee ?? null;
  const vehicle = (job as DeliveryRow & { required_vehicle_type?: string }).required_vehicle_type;

  return (
    <div className="fixed inset-0 z-[10070] flex items-end justify-center bg-black/50 p-3 pb-[calc(var(--agrolink-tab-bar,3.5rem)+env(safe-area-inset-bottom)+0.5rem)] sm:items-center sm:p-6">
      <div
        className="w-full max-w-md animate-in slide-in-from-bottom duration-300 rounded-3xl border border-border bg-background p-5 shadow-2xl"
        role="dialog"
        aria-label="New delivery offer"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600">New job offer</p>
            <h2 className="mt-1 font-sans text-xl font-bold">Delivery request</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-border"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {job.accept_deadline && (
          <div className="mt-3">
            <JobAcceptCountdown deadline={job.accept_deadline} onExpired={onExpired} />
          </div>
        )}

        <div className="mt-4 space-y-3 rounded-2xl bg-muted/50 p-4 text-sm">
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
            <span>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Pickup</span>
              <br />
              {job.pickup_address ?? "Farm pickup"}
            </span>
          </p>
          <p className="flex items-start gap-2">
            <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Dropoff</span>
              <br />
              {job.delivery_address ?? "Buyer address"}
            </span>
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {job.estimated_distance_km != null && (
              <span className="inline-flex items-center gap-1">
                <Truck className="h-3.5 w-3.5" /> {job.estimated_distance_km} km
              </span>
            )}
            {vehicle && <span>Vehicle: {vehicle}</span>}
            {fee != null && <span className="font-semibold text-foreground">Earn GHS {Number(fee).toFixed(2)}</span>}
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onDecline}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-border py-3 text-sm font-medium"
          >
            <X className="h-4 w-4" /> Decline
          </button>
          <button
            type="button"
            disabled={accepting}
            onClick={onAccept}
            className="inline-flex flex-[1.4] items-center justify-center gap-2 rounded-full bg-emerald-500 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Check className="h-4 w-4" /> {accepting ? "Accepting…" : "Accept job"}
          </button>
        </div>
      </div>
    </div>
  );
}
