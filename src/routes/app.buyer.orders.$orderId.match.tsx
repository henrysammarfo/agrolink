import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, MapPin, MessageCircle } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { CorridorMap } from "@/components/map/CorridorMap";
import { fetchOrderById } from "@/lib/api/orders";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { LiveTrackCard } from "@/components/track/LiveTrackCard";
import { apiFetch } from "@/lib/api/fetch-auth";
import { ACCRA_CENTER, isValidMapCoord, STREET_ZOOM } from "@/lib/map-coords";

export const Route = createFileRoute("/app/buyer/orders/$orderId/match")({
  head: () => ({ meta: [{ title: "Finding driver · AgroLink" }] }),
  component: DriverMatchPage,
});

function DriverMatchPage() {
  const { orderId } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pulse, setPulse] = useState(0);
  const [driversNearby, setDriversNearby] = useState(0);

  const { data: order, refetch, isLoading } = useQuery({
    queryKey: ["order-match", orderId],
    queryFn: () => fetchOrderById(orderId),
    enabled: !!orderId,
    refetchInterval: 5000,
  });

  const delivery = order?.delivery;
  const searching = delivery?.status === "requested" && !delivery?.driver_id;
  const matched = !!delivery?.driver_id;
  const paymentPending = order?.payment_status !== "paid";

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => p + 1), 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (matched) void refetch();
  }, [matched, refetch]);

  useEffect(() => {
    if (!paymentPending || !order) return;
    const tryVerify = () => {
      apiFetch("/api/orders/verify-payment", {
        method: "POST",
        body: JSON.stringify({ orderId }),
      })
        .then((r) => r.json())
        .then((j: { ok?: boolean }) => {
          if (j.ok) {
            if (user?.id) {
              void queryClient.invalidateQueries({ queryKey: ["buyer-orders", user.id] });
            }
            void refetch();
          }
        })
        .catch(() => undefined);
    };
    tryVerify();
    const interval = setInterval(tryVerify, 8000);
    return () => clearInterval(interval);
  }, [paymentPending, order, orderId, refetch, user?.id, queryClient]);

  useEffect(() => {
    if (!delivery || matched) return;
    const load = () => {
      const params = new URLSearchParams({
        pickupLat: String(delivery.pickup_lat),
        pickupLng: String(delivery.pickup_lng),
        deliveryLat: String(delivery.delivery_lat),
        deliveryLng: String(delivery.delivery_lng),
        weightKg: "10",
      });
      apiFetch(`/api/delivery/availability?${params}`)
        .then((r) => r.json())
        .then((j: { driversNearby?: number }) => setDriversNearby(j.driversNearby ?? 0))
        .catch(() => setDriversNearby(0));
    };
    load();
    const interval = setInterval(load, 15_000);
    return () => clearInterval(interval);
  }, [delivery?.pickup_lat, delivery?.pickup_lng, delivery?.delivery_lat, delivery?.delivery_lng, matched]);

  const pins = useMemo(() => {
    if (!delivery) return [];
    const list: { lat: number; lng: number; label: string; kind: "farm" | "buyer" | "driver" }[] = [];
    if (isValidMapCoord(delivery.pickup_lat, delivery.pickup_lng)) {
      list.push({ lat: delivery.pickup_lat, lng: delivery.pickup_lng, label: "Farm", kind: "farm" });
    }
    if (isValidMapCoord(delivery.delivery_lat, delivery.delivery_lng)) {
      list.push({ lat: delivery.delivery_lat, lng: delivery.delivery_lng, label: "You", kind: "buyer" });
    }
    return list;
  }, [delivery]);

  const mapCenter = useMemo((): [number, number] => {
    if (!pins.length) return ACCRA_CENTER;
    const lat = pins.reduce((s, p) => s + p.lat, 0) / pins.length;
    const lng = pins.reduce((s, p) => s + p.lng, 0) / pins.length;
    return [lat, lng];
  }, [pins]);

  if (isLoading || !order) {
    return (
      <AppShell role="buyer">
        <div className="grid min-h-[60vh] place-items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (matched && delivery) {
    const driverUserId = delivery.driver?.user_id;
    return (
      <AppShell role="buyer">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <h1 className="font-serif text-2xl">Driver matched</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track your delivery live below.</p>
          <div className="mt-6">
            <LiveTrackCard order={order} />
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link
              to="/app/buyer/orders/$orderId/track"
              params={{ orderId }}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-foreground py-3 text-sm font-medium text-background"
            >
              Open full-screen map
            </Link>
            {driverUserId && (
              <Link
                to="/app/inbox/chat/$userId"
                params={{ userId: driverUserId }}
                search={{ order: orderId }}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-border py-3 text-sm font-medium"
              >
                <MessageCircle className="h-4 w-4" /> Message driver
              </Link>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  const radius = (delivery as { search_radius_km?: number })?.search_radius_km ?? 20;
  const round = (delivery as { offer_round?: number })?.offer_round ?? 1;

  return (
    <AppShell role="buyer" hideMobileNav>
      <div className="relative -mx-6 -mt-6 h-[100dvh] min-h-[500px] md:-mx-10 md:-mt-10">
        <CorridorMap
          pins={pins}
          fitKey={`${orderId}-${driversNearby}`}
          center={mapCenter}
          zoom={STREET_ZOOM}
          corridorOnly
          dark
          height="100%"
        />
        <div className="absolute inset-x-0 bottom-0 px-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
          <div className="mx-auto max-w-lg rounded-3xl border border-border bg-background/95 p-6 shadow-2xl backdrop-blur">
            <div className="flex items-center gap-3">
              <span className={`grid h-12 w-12 place-items-center rounded-full bg-primary/15 ${pulse % 2 === 0 ? "scale-100" : "scale-110"} transition-transform`}>
                <MapPin className="h-6 w-6 text-primary animate-pulse" />
              </span>
              <div>
                <h1 className="font-serif text-xl">Searching for drivers</h1>
                <p className="text-xs text-muted-foreground">
                  Round {round} · within {radius} km
                  {driversNearby > 0 && " · couriers in area"}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {order.payment_status === "paid"
                ? "Nearby verified drivers are being notified. You'll see your driver here once they accept."
                : "Complete payment on Paystack — drivers are notified after payment confirms."}
            </p>
            {delivery && (
              <div className="mt-3 text-xs text-muted-foreground">
                {delivery.pickup_address} → {delivery.delivery_address}
              </div>
            )}
            <Link
              to="/app/buyer/orders/$orderId/track"
              params={{ orderId }}
              className="mt-5 block text-center text-xs text-primary hover:underline"
            >
              View tracking page
            </Link>
            <Link
              to="/app/buyer/orders"
              className="mt-2 block text-center text-xs text-muted-foreground hover:underline"
            >
              View all orders
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
