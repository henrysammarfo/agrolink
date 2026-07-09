import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { CorridorMap } from "@/components/map/CorridorMap";
import { useAuth } from "@/lib/auth";
import { fetchOrderById } from "@/lib/api/orders";
import { useQuery } from "@tanstack/react-query";
import { LiveTrackCard } from "@/components/track/LiveTrackCard";

export const Route = createFileRoute("/app/buyer/orders/$orderId/match")({
  head: () => ({ meta: [{ title: "Finding driver · AgroLink" }] }),
  component: DriverMatchPage,
});

function DriverMatchPage() {
  const { orderId } = Route.useParams();
  const { user } = useAuth();
  const [pulse, setPulse] = useState(0);

  const { data: order, refetch, isLoading } = useQuery({
    queryKey: ["order-match", orderId],
    queryFn: () => fetchOrderById(orderId),
    enabled: !!orderId,
    refetchInterval: 5000,
  });

  const delivery = order?.delivery;
  const searching = delivery?.status === "requested" && !delivery?.driver_id;
  const matched = !!delivery?.driver_id;

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => p + 1), 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (matched) void refetch();
  }, [matched, refetch]);

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
    return (
      <AppShell role="buyer">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <h1 className="font-serif text-2xl">Driver matched</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track your delivery live below.</p>
          <div className="mt-6">
            <LiveTrackCard order={order} />
          </div>
          <Link
            to="/app/buyer/orders/$orderId/track"
            params={{ orderId }}
            className="mt-4 block text-center text-sm text-primary hover:underline"
          >
            Open full-screen map
          </Link>
        </div>
      </AppShell>
    );
  }

  const pins = delivery
    ? [
        { lat: delivery.pickup_lat, lng: delivery.pickup_lng, label: "Farm", kind: "farm" as const },
        { lat: delivery.delivery_lat, lng: delivery.delivery_lng, label: "You", kind: "buyer" as const },
      ]
    : [];

  const radius = (delivery as { search_radius_km?: number })?.search_radius_km ?? 20;
  const round = (delivery as { offer_round?: number })?.offer_round ?? 1;

  return (
    <AppShell role="buyer">
      <div className="relative -mx-6 -mt-6 h-[calc(100vh-120px)] min-h-[500px] md:-mx-10 md:-mt-10">
        <CorridorMap pins={pins} dark height="100%" />
        <div className="absolute inset-x-0 bottom-0 px-4 pb-8">
          <div className="mx-auto max-w-lg rounded-3xl border border-border bg-background/95 p-6 shadow-2xl backdrop-blur">
            <div className="flex items-center gap-3">
              <span className={`grid h-12 w-12 place-items-center rounded-full bg-primary/15 ${pulse % 2 === 0 ? "scale-100" : "scale-110"} transition-transform`}>
                <MapPin className="h-6 w-6 text-primary animate-pulse" />
              </span>
              <div>
                <h1 className="font-serif text-xl">Searching for drivers</h1>
                <p className="text-xs text-muted-foreground">
                  Round {round} · within {radius} km
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {order.payment_status === "paid"
                ? "Nearby verified drivers are being notified. You'll see your driver here once they accept."
                : "Approve MoMo payment on your phone — drivers are notified after payment confirms."}
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
          </div>
        </div>
      </div>
    </AppShell>
  );
}
