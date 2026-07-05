import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { LiveTrackCard } from "@/components/track/LiveTrackCard";
import { OrderTracker } from "@/components/order/OrderTracker";
import { useAuth } from "@/lib/auth";
import { useBuyerOrders } from "@/hooks/use-marketplace";
import { buildTrackedOrder } from "@/lib/types/fulfillment";

export const Route = createFileRoute("/app/buyer/orders/$orderId/track")({
  head: () => ({ meta: [{ title: "Track order · AgroLink" }] }),
  component: FullscreenTrack,
});

function FullscreenTrack() {
  const { orderId } = Route.useParams();
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useBuyerOrders(user?.id);
  const order = orders.find((o) => o.id === orderId);

  return (
    <div className="relative min-h-[100dvh] bg-black">
      <Link
        to="/app/buyer/orders"
        className="fixed left-4 top-[max(env(safe-area-inset-top),12px)] z-50 grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white backdrop-blur border border-white/10"
        aria-label="Back to orders"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>

      {isLoading ? (
        <div className="grid min-h-[100dvh] place-items-center">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      ) : !order ? (
        <div className="grid min-h-[100dvh] place-items-center p-8 text-center text-white">
          <p className="font-sans text-lg">Order not found</p>
          <Link to="/app/buyer/orders" className="mt-4 text-primary underline">Back to orders</Link>
        </div>
      ) : (
        <div className="min-h-[100dvh] flex flex-col">
          <div className="flex-1">
            <LiveTrackCard order={order} fullscreen />
          </div>
          <div className="p-4 pb-[max(env(safe-area-inset-bottom),16px)]">
            <OrderTracker order={buildTrackedOrder(order)} />
          </div>
        </div>
      )}
    </div>
  );
}
