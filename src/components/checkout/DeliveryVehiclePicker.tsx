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
};

type Props = {
  pickupLat: number;
  pickupLng: number;
  deliveryLat: number;
  deliveryLng: number;
  weightKg: number;
  value: "bicycle" | "motorcycle" | "car";
  onChange: (v: "bicycle" | "motorcycle" | "car") => void;
};

export function DeliveryVehiclePicker({
  pickupLat, pickupLng, deliveryLat, deliveryLng, weightKg, value, onChange,
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
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking nearby drivers…
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
                    : opt.status === "busy"
                      ? "Busy"
                      : "Unavailable"}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-serif text-lg text-primary">GHS {opt.price.toFixed(0)}</div>
              <div className={`text-[10px] uppercase tracking-widest ${
                opt.status === "available" ? "text-emerald-600" : "text-muted-foreground"
              }`}>
                {opt.status}
              </div>
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
