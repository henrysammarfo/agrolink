import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Phone, MessageCircle, Clock, Navigation, ChevronUp, ChevronDown } from "lucide-react";
import { CorridorMap } from "@/components/map/CorridorMap";
import { ChatThread } from "@/components/chat/ChatThread";
import { fetchOsrmRoute } from "@/lib/api/driver";
import { subscribeToDelivery, subscribeToDriverLocation } from "@/lib/api/orders";
import { useAuth } from "@/lib/auth";
import type { DeliveryRow, OrderRow } from "@/lib/types/marketplace";
import { toast } from "sonner";

const STATUS_STEPS = ["confirmed", "processing", "dispatched", "delivered"] as const;
const DELIVERY_TRACKING = [
  "driver_assigned",
  "driver_enroute_pickup",
  "picked_up",
  "enroute_delivery",
] as const;

type Props = { order: OrderRow; fullscreen?: boolean };

export function LiveTrackCard({ order, fullscreen }: Props) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [liveDelivery, setLiveDelivery] = useState(order.delivery);
  const delivery = liveDelivery;
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  const [etaMin, setEtaMin] = useState<number | null>(null);
  const [tripChatOpen, setTripChatOpen] = useState(false);

  useEffect(() => {
    setLiveDelivery(order.delivery);
  }, [order.delivery, order.id]);

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
  }, [delivery?.id, delivery?.pickup_lat, delivery?.pickup_lng, delivery?.delivery_lat, delivery?.delivery_lng]);

  useEffect(() => {
    if (!delivery?.id) return;
    return subscribeToDelivery(delivery.id, (updated) =>
      setLiveDelivery((prev) => (prev ? { ...prev, ...updated } : updated)),
    );
  }, [delivery?.id]);

  useEffect(() => {
    if (delivery?.driver?.current_lat != null && delivery?.driver?.current_lng != null) {
      setDriverPos({ lat: delivery.driver.current_lat, lng: delivery.driver.current_lng });
    }
  }, [delivery?.driver?.current_lat, delivery?.driver?.current_lng]);

  useEffect(() => {
    if (!delivery?.driver_id) return;
    return subscribeToDriverLocation(delivery.driver_id, (pos) =>
      setDriverPos({ lat: pos.current_lat, lng: pos.current_lng }),
    );
  }, [delivery?.driver_id]);

  const callDriver = () => {
    const phone = delivery?.driver?.profile?.phone;
    if (phone) window.location.href = `tel:${phone}`;
    else toast.info("Driver phone not available yet");
  };

  const messageDriver = () => {
    const driverUserId = delivery?.driver?.user_id;
    if (!driverUserId) {
      toast.info("Driver not assigned yet");
      return;
    }
    navigate({
      to: "/app/inbox/chat/$userId",
      params: { userId: driverUserId },
      search: { order: order.id },
    });
  };

  if (!delivery) {
    return (
      <div className={`${fullscreen ? "min-h-[60vh] bg-black" : "rounded-3xl border border-border bg-card"} p-8 text-center text-muted-foreground`}>
        <p className="mt-3 text-sm">Preparing delivery…</p>
      </div>
    );
  }

  if (delivery.status === "requested" && !delivery.driver_id) {
    const radius = (delivery as { search_radius_km?: number }).search_radius_km ?? 20;
    const round = (delivery as { offer_round?: number }).offer_round ?? 1;
    return (
      <div className={`overflow-hidden ${fullscreen ? "bg-black text-white" : "rounded-3xl border border-border bg-card"}`}>
        <div className={`relative ${fullscreen ? "h-[45vh]" : "h-[220px]"}`}>
          <CorridorMap
            pins={[
              { lat: delivery.pickup_lat, lng: delivery.pickup_lng, label: "Farm", kind: "farm" },
              { lat: delivery.delivery_lat, lng: delivery.delivery_lng, label: "You", kind: "buyer" },
            ]}
            dark
            height={fullscreen ? "45vh" : "220px"}
          />
        </div>
        <div className={`p-6 ${fullscreen ? "text-white" : ""}`}>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-primary animate-ping" />
            <h2 className="font-serif text-xl">Searching for drivers</h2>
          </div>
          <p className="mt-2 text-sm opacity-80">
            Round {round} · scanning within {radius} km for a verified driver.
          </p>
          <Link
            to="/app/buyer/orders/$orderId/match"
            params={{ orderId: order.id }}
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            Open live search view
          </Link>
        </div>
      </div>
    );
  }

  const pins = [
    { lat: delivery.pickup_lat, lng: delivery.pickup_lng, label: "Farm", kind: "farm" as const },
    { lat: delivery.delivery_lat, lng: delivery.delivery_lng, label: "You", kind: "buyer" as const },
    ...(driverPos
      ? [{ lat: driverPos.lat, lng: driverPos.lng, label: "Driver", kind: "driver" as const }]
      : []),
  ];

  const deliveryStep = delivery?.status
    ? DELIVERY_TRACKING.indexOf(delivery.status as (typeof DELIVERY_TRACKING)[number])
    : -1;
  const orderStep = STATUS_STEPS.indexOf(order.status as (typeof STATUS_STEPS)[number]);
  const currentIndex = deliveryStep >= 0 ? Math.min(deliveryStep + 1, STATUS_STEPS.length - 1) : orderStep;
  const progress = currentIndex >= 0 ? (currentIndex + 1) / STATUS_STEPS.length : 0.25;

  const mapHeight = fullscreen ? "min-h-[55vh] h-[55vh]" : "280px";

  return (
    <div className={`overflow-hidden ${fullscreen ? "bg-black" : "rounded-3xl border border-border bg-card shadow-sm"}`}>
      <div className={`relative ${fullscreen ? "h-[55vh] min-h-[55vh]" : "h-[280px] md:h-[340px]"}`}>
        <CorridorMap pins={pins} route={routeCoords} animateDriver={!!driverPos} driverLabel="Driver" dark height={mapHeight} />
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
        {fullscreen && (
          <Link
            to="/app/buyer/orders"
            className="pointer-events-auto absolute bottom-4 right-4 rounded-full bg-white/15 px-3 py-1.5 text-xs text-white backdrop-blur"
          >
            All orders
          </Link>
        )}
      </div>

      {fullscreen ? (
        <div className="bg-black/90 p-5 text-white border-t border-white/10">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/30 font-sans text-lg font-bold">
              {(delivery.driver?.profile?.display_name ?? "D")[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-sans font-semibold truncate">
                {delivery.driver?.profile?.display_name ?? "Finding driver…"}
              </div>
              <div className="text-xs text-white/70">{delivery.pickup_address} → {delivery.delivery_address}</div>
            </div>
            <button onClick={callDriver} className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500" aria-label="Call">
              <Phone className="h-4 w-4" />
            </button>
            <button onClick={messageDriver} className="grid h-10 w-10 place-items-center rounded-full border border-white/20" aria-label="Message">
              <MessageCircle className="h-4 w-4" />
            </button>
          </div>
          {delivery.driver?.user_id && user?.id && (
            <div className="mt-4 border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={() => setTripChatOpen((o) => !o)}
                className="flex w-full items-center justify-between text-xs text-white/80"
              >
                <span>In-trip chat with your driver</span>
                {tripChatOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </button>
              {tripChatOpen && (
                <div className="mt-3 max-h-[40vh] overflow-hidden rounded-2xl bg-background text-foreground">
                  <ChatThread
                    userId={user.id}
                    partnerId={delivery.driver.user_id}
                    partnerName={delivery.driver.profile?.display_name ?? "Driver"}
                    senderName={profile?.display_name ?? "You"}
                    orderId={order.id}
                    deliveryId={delivery.id}
                    tripMode
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="p-5 md:p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary/15 font-sans text-xl font-bold text-primary">
              {(delivery.driver?.profile?.display_name ?? "D")[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-widest text-primary/80">{order.id.slice(0, 8)}</div>
              <div className="truncate font-sans text-xl font-semibold">
                {delivery.driver?.profile?.display_name ?? "Finding driver…"}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {delivery.driver?.vehicle_type ?? "Vehicle"} · {delivery.driver?.plate_number ?? "—"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={callDriver}
                className="grid h-11 w-11 place-items-center rounded-full bg-emerald-500 text-white"
                aria-label="Call driver"
              >
                <Phone className="h-4 w-4" />
              </button>
              <button
                onClick={messageDriver}
                className="grid h-11 w-11 place-items-center rounded-full border border-border"
                aria-label="Message driver"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-background p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Navigation className="h-3 w-3 text-primary" /> {delivery.pickup_address} → {delivery.delivery_address}
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
            <div className="font-sans text-2xl font-bold text-primary">GHS {order.total_amount}</div>
            <Link
              to="/app/buyer/orders/$orderId/track"
              params={{ orderId: order.id }}
              className="text-xs uppercase tracking-widest text-primary hover:underline"
            >
              Full-screen track
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
