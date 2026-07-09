import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Phone, MessageCircle, Navigation, ChevronUp, ChevronDown, UserPlus, ChevronRight } from "lucide-react";
import { CorridorMap } from "@/components/map/CorridorMap";
import { ChatThread } from "@/components/chat/ChatThread";
import { fetchDrivingRoute } from "@/lib/api/driver";
import { subscribeToDelivery, subscribeToDriverLocation } from "@/lib/api/orders";
import { toggleFollow, fetchIsFollowing } from "@/lib/api/engagement";
import { buildTrafficSegments } from "@/lib/route-display";
import type { RouteStep } from "@/lib/api/maps";
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
  const [routeSteps, setRouteSteps] = useState<RouteStep[]>([]);
  const [routeSource, setRouteSource] = useState<"google" | "osrm" | null>(null);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  const [etaMin, setEtaMin] = useState<number | null>(null);
  const [tripChatOpen, setTripChatOpen] = useState(false);
  const [followingDriver, setFollowingDriver] = useState(false);

  const driverUserId = delivery?.driver?.user_id;
  const driverProfile = delivery?.driver?.profile as {
    display_name?: string | null;
    slug?: string | null;
    username?: string | null;
  } | undefined;
  const driverHandle = driverProfile?.username ?? driverProfile?.slug ?? driverUserId ?? "";

  useEffect(() => {
    if (!user?.id || !driverHandle || !driverUserId) return;
    void fetchIsFollowing(user.id, driverHandle).then(setFollowingDriver);
  }, [user?.id, driverHandle, driverUserId]);

  const followDriver = async () => {
    if (!user?.id || !driverHandle) {
      toast.error("Sign in to follow");
      return;
    }
    const next = !followingDriver;
    setFollowingDriver(next);
    try {
      await toggleFollow(user.id, driverHandle, next, profile?.display_name ?? undefined);
      toast.success(next ? "Following driver" : "Unfollowed driver");
    } catch {
      setFollowingDriver(!next);
      toast.error("Could not update follow");
    }
  };

  useEffect(() => {
    setLiveDelivery(order.delivery);
  }, [order.delivery, order.id]);

  useEffect(() => {
    if (!delivery) return;
    fetchDrivingRoute(
      { lat: delivery.pickup_lat, lng: delivery.pickup_lng },
      { lat: delivery.delivery_lat, lng: delivery.delivery_lng },
    ).then((r) => {
      if (r) {
        setRouteCoords(r.coordinates);
        setRouteSteps(r.steps ?? []);
        setEtaMin(Math.round(r.duration_in_traffic_min ?? r.duration_min));
        setRouteSource(r.source);
      }
    });
  }, [delivery?.id, delivery?.pickup_lat, delivery?.pickup_lng, delivery?.delivery_lat, delivery?.delivery_lng]);

  const routeSegments = useMemo(
    () => buildTrafficSegments(routeCoords, routeSteps),
    [routeCoords, routeSteps],
  );

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
  const driverName = delivery.driver?.profile?.display_name ?? "Driver";
  const vehicleDesc = [
    delivery.driver?.vehicle_color,
    delivery.driver?.vehicle_make,
    delivery.driver?.vehicle_model,
  ].filter(Boolean).join(" ") || delivery.driver?.vehicle_type || "Vehicle";
  const plate = delivery.driver?.plate_number ?? "—";

  return (
    <div className={`overflow-hidden ${fullscreen ? "bg-black" : "rounded-3xl border border-border bg-card shadow-sm"}`}>
      <div className={`relative ${fullscreen ? "h-[55vh] min-h-[55vh]" : "h-[280px] md:h-[340px]"}`}>
        <CorridorMap
          pins={pins}
          route={routeCoords}
          routeSegments={routeSegments}
          fitKey={delivery.id}
          animateDriver={!!driverPos}
          driverPosition={driverPos}
          driverLabel="Driver"
          dark={false}
          height={mapHeight}
          etaLabel={etaMin != null ? `${etaMin} min` : undefined}
          priceLabel={`GHS ${Math.round(order.total_amount)}`}
        />
      </div>

      <div className={`${fullscreen ? "bg-black/95 text-white" : "bg-background"} border-t border-border/60 p-4 md:p-5`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1 font-sans text-lg font-bold">
              {etaMin != null ? `Arriving in ~${etaMin} min` : delivery.status.replace(/_/g, " ")}
              <ChevronRight className="h-4 w-4 opacity-60" />
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground capitalize">
              {vehicleDesc}
              {routeSource && (
                <span className={`ml-2 text-[10px] uppercase font-semibold ${routeSource === "google" ? "text-blue-500" : "text-amber-600"}`}>
                  · {routeSource} route
                </span>
              )}
            </p>
          </div>
          <div className={`shrink-0 rounded-xl px-3 py-2 text-center ${fullscreen ? "bg-white/10" : "bg-muted"}`}>
            <div className="font-mono text-sm font-bold">{plate}</div>
            <div className="text-[10px] uppercase tracking-widest opacity-60">Plate</div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="relative">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/15 font-sans text-xl font-bold text-primary">
              {driverName[0]}
            </div>
            {delivery.driver?.rating != null && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-background px-1.5 py-0.5 text-[10px] font-semibold shadow">
                {Number(delivery.driver.rating).toFixed(2)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {driverUserId && driverHandle ? (
              <Link to="/app/users/$slug" params={{ slug: driverHandle }} className="truncate font-sans font-semibold block hover:underline">
                {driverName}
              </Link>
            ) : (
              <div className="truncate font-sans font-semibold">{driverName}</div>
            )}
            <div className={`text-xs ${fullscreen ? "text-white/70" : "text-muted-foreground"}`}>
              {delivery.pickup_address} → {delivery.delivery_address}
            </div>
          </div>
          <div className="flex gap-2">
            {driverUserId && user?.id && user.id !== driverUserId && (
              <button onClick={followDriver} className="grid h-11 w-11 place-items-center rounded-full border border-border" aria-label="Follow driver">
                <UserPlus className={`h-4 w-4 ${followingDriver ? "text-primary" : ""}`} />
              </button>
            )}
            <button onClick={callDriver} className="grid h-11 w-11 place-items-center rounded-full bg-emerald-500 text-white" aria-label="Call driver">
              <Phone className="h-4 w-4" />
            </button>
            <button onClick={messageDriver} className="grid h-11 w-11 place-items-center rounded-full border border-border" aria-label="Message driver">
              <MessageCircle className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!fullscreen && (
          <div className="mt-4 rounded-2xl bg-muted/50 p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Navigation className="h-3 w-3 text-primary" /> Trip progress
              </span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-primary to-accent transition-[width]"
                style={{ width: `${Math.max(6, progress * 100)}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="font-sans text-xl font-bold text-primary">GHS {order.total_amount}</div>
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

        {fullscreen && delivery.driver?.user_id && user?.id && (
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
                  partnerName={driverName}
                  senderName={profile?.display_name ?? "You"}
                  orderId={order.id}
                  deliveryId={delivery.id}
                  tripMode
                />
              </div>
            )}
          </div>
        )}

        {fullscreen && (
          <Link
            to="/app/buyer/orders"
            className="mt-4 inline-block text-xs text-white/70 hover:text-white"
          >
            ← All orders
          </Link>
        )}
      </div>
    </div>
  );
}
