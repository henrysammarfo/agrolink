import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api/fetch-auth";

export type VehicleOption = {
  type: "bicycle" | "motorcycle" | "car";
  label: string;
  icon: string;
  price: number;
  status: "available" | "unavailable" | "busy";
  driversNearby: number;
  etaMin?: number;
};

type Props = {
  pickupLat: number;
  pickupLng: number;
  deliveryLat: number;
  deliveryLng: number;
  weightKg: number;
  value: "bicycle" | "motorcycle" | "car";
  onChange: (v: "bicycle" | "motorcycle" | "car") => void;
  etaMin?: number;
  horizontal?: boolean;
};

const ETA_FACTOR: Record<VehicleOption["type"], number> = {
  bicycle: 1.35,
  motorcycle: 1,
  car: 1.15,
};

export function DeliveryVehiclePicker({
  pickupLat, pickupLng, deliveryLat, deliveryLng, weightKg, value, onChange, etaMin, horizontal = true,
}: Props) {
  const [options, setOptions] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      pickupLat: String(pickupLat),
      pickupLng: String(pickupLng),
      deliveryLat: String(deliveryLat),
      deliveryLng: String(deliveryLng),
      weightKg: String(weightKg),
    });
    apiFetch(`/api/delivery/availability?${params}`)
      .then((r) => r.json())
      .then((j: { options: VehicleOption[] }) => {
        setOptions(j.options ?? []);
        const firstAvailable = j.options?.find((o) => o.status === "available");
        if (firstAvailable && !j.options.some((o) => o.type === value && o.status === "available")) {
          onChange(firstAvailable.type);
        }
      })
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, [pickupLat, pickupLng, deliveryLat, deliveryLng, weightKg]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking delivery options…
      </div>
    );
  }

  const baseEta = etaMin ?? options.find((o) => o.type === value)?.etaMin ?? 10;
  const availableCount = options.filter((o) => o.status === "available").length;
  const onlyMotor =
    availableCount === 1 && options.find((o) => o.status === "available")?.type === "motorcycle";

  if (horizontal) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Choose delivery</p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
          {options.map((opt) => {
            const selected = value === opt.type;
            const disabled = opt.status !== "available";
            const mins = Math.max(3, Math.round(opt.etaMin ?? baseEta * ETA_FACTOR[opt.type]));
            return (
              <button
                key={opt.type}
                type="button"
                disabled={disabled}
                onClick={() => onChange(opt.type)}
                className={`flex min-w-[7.5rem] shrink-0 flex-col rounded-2xl border p-3 text-left transition ${
                  selected ? "border-primary bg-primary/10 shadow-sm" : "border-border bg-card"
                } ${disabled ? "opacity-45" : ""}`}
              >
                <span className="text-2xl">{opt.icon}</span>
                <span className="mt-2 text-sm font-semibold">{opt.label}</span>
                <span className="text-xs text-muted-foreground">{mins} min</span>
                <span className="mt-1 font-sans text-base font-bold text-primary">
                  {opt.type === "motorcycle" ? `GHS ${opt.price.toFixed(0)}` : `from GHS ${opt.price.toFixed(0)}`}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          You&apos;ve chosen {options.find((o) => o.type === value)?.label ?? "delivery"}. Tap to change.
          {onlyMotor && " Only motorbike couriers are nearby right now."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Choose delivery</p>
      {options.map((opt) => {
        const selected = value === opt.type;
        const disabled = opt.status !== "available";
        return (
          <button
            key={opt.type}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.type)}
            className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
              selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
            } ${disabled ? "opacity-50" : ""}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{opt.icon}</span>
              <div>
                <div className="font-medium">{opt.label}</div>
                <div className="text-xs text-muted-foreground">
                  {opt.status === "available"
                    ? `${opt.driversNearby} driver${opt.driversNearby === 1 ? "" : "s"} nearby`
                    : opt.status}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-serif text-lg text-primary">GHS {opt.price.toFixed(0)}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function mapQuoteVehicle(type: "bicycle" | "motorcycle" | "car") {
  if (type === "car") return "pickup";
  return "motorcycle";
}

export { mapQuoteVehicle };
