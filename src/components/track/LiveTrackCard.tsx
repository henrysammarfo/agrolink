import { useEffect, useState } from "react";
import { Phone, MessageCircle, Clock, Navigation, Loader2 } from "lucide-react";
import { CorridorMap } from "@/components/map/CorridorMap";
import { fetchOsrmRoute } from "@/lib/api/driver";
import { subscribeToDelivery, subscribeToDriverLocation } from "@/lib/api/orders";
import type { OrderRow } from "@/lib/types/marketplace";

const STATUS_STEPS = ["confirmed", "processing", "dispatched", "delivered"] as const;

export function LiveTrackCard({ order }: { order: OrderRow }) {
  const delivery = order.delivery;
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  const [etaMin, setEtaMin] = useState<number | null>(null);

  useEffect(() => {
    if (!delivery) return;
    fetchOsrmRoute(
      { lat: delivery.pickup_lat, lng: delivery.pickup_lng },
      { lat: delivery.delivery_lat, lng: delivery.delivery_lng },
    ).then((r) => {
      if (r) {
        setRouteCoords(r.coordinates);
        setEtaMin(Math.round(r.duration_min));
      }
    });
  }, [delivery?.id]);

  useEffect(() => {
    if (!delivery?.id) return;
    return subscribeToDelivery(delivery.id, (updated) => {
      if (updated.driver_id && delivery.driver?.current_lat) {
        setDriverPos({ lat: delivery.driver.current_lat!, lng: delivery.driver.current_lng! });
      }
    });
  }, [delivery?.id]);

  useEffect(() => {
    if (!delivery?.driver_id) return;
    return subscribeToDriverLocation(delivery.driver_id, (pos) => setDriverPos(pos));
  }, [delivery?.driver_id]);

  if (!delivery) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 text-center text-muted-foreground">
        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
        <p className="mt-3 text-sm">Preparing delivery…</p>
      </div>
    );
  }

  const pins = [
    { lat: delivery.pickup_lat, lng: delivery.pickup_lng, label: "Farm", kind: "farm" as const },
    {
      lat: delivery.delivery_lat,
      lng: delivery.delivery_lng,
      label: "You",
      kind: "buyer" as const,
    },
    ...(driverPos
      ? [{ lat: driverPos.lat, lng: driverPos.lng, label: "Driver", kind: "driver" as const }]
      : []),
  ];

  const currentIndex = STATUS_STEPS.indexOf(order.status as (typeof STATUS_STEPS)[number]);
  const progress = currentIndex >= 0 ? (currentIndex + 1) / STATUS_STEPS.length : 0.25;

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="relative h-[280px] md:h-[340px]">
        <CorridorMap pins={pins} route={routeCoords} animateDriver={false} driverLabel="Driver" />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center p-4">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-background/95 px-4 py-2 text-xs shadow-lg backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-medium">{delivery.status.replace(/_/g, " ")}</span>
            {etaMin != null && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" /> ~{etaMin} min
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 md:p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary/15 font-serif text-xl text-primary">
            {(delivery.driver?.profile?.display_name ?? "D")[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-widest text-primary/80">
              {order.id.slice(0, 8)}
            </div>
            <div className="truncate font-serif text-xl">
              {delivery.driver?.profile?.display_name ?? "Finding driver…"}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {delivery.driver?.vehicle_type ?? "Vehicle"} · {delivery.driver?.plate_number ?? "—"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="grid h-11 w-11 place-items-center rounded-full bg-emerald-500 text-white"
              aria-label="Call"
            >
              <Phone className="h-4 w-4" />
            </button>
            <button
              className="grid h-11 w-11 place-items-center rounded-full border border-border"
              aria-label="Message"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-background p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Navigation className="h-3 w-3 text-primary" /> {delivery.pickup_address} →{" "}
              {delivery.delivery_address}
            </span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-primary to-accent transition-[width]"
              style={{ width: `${Math.max(6, progress * 100)}%` }}
            />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div className="font-serif text-2xl text-primary">GHS {order.total_amount}</div>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            {order.payment_status}
          </span>
        </div>
      </div>
    </div>
  );
}
