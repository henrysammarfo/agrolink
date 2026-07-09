import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, MapPin, MessageCircle, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import { fetchOrderById } from "@/lib/api/orders";
import { LiveTrackCard } from "@/components/track/LiveTrackCard";

export const Route = createFileRoute("/app/buyer/orders/$orderId/success")({
  head: () => ({ meta: [{ title: "Order placed · AgroLink" }] }),
  component: OrderSuccessPage,
});

function OrderSuccessPage() {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order-success", orderId],
    queryFn: () => fetchOrderById(orderId),
    enabled: !!orderId,
    refetchInterval: 5000,
  });

  const delivery = order?.delivery;
  const driverUserId = delivery?.driver?.user_id;
  const hasDelivery = !!delivery;

  return (
    <AppShell role="buyer" hideMobileNav compact>
      <div className="mx-auto max-w-lg">
        {isLoading || !order ? (
          <div className="grid place-items-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="rounded-3xl border border-primary/30 bg-primary/5 p-6 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
              <h1 className="mt-4 font-serif text-2xl sm:text-3xl">Payment initiated</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {order.payment_status === "paid"
                  ? "Payment confirmed — your order is on the way."
                  : "Approve MoMo on your phone. Tracking starts once payment confirms."}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Order #{orderId.slice(0, 8)}</p>
            </div>

            {hasDelivery && (
              <div className="mt-6">
                <LiveTrackCard order={order} />
              </div>
            )}

            <div className="mt-6 grid gap-3">
              {hasDelivery && (
                <button
                  type="button"
                  onClick={() => navigate({ to: "/app/buyer/orders/$orderId/match", params: { orderId } })}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-medium text-background"
                >
                  <MapPin className="h-4 w-4" />
                  {delivery?.driver_id ? "Track driver live" : "Searching for drivers"}
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate({ to: "/app/buyer/orders/$orderId/track", params: { orderId } })}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border py-3.5 text-sm font-medium"
              >
                <ArrowRight className="h-4 w-4" /> Full-screen map
              </button>
              {driverUserId && (
                <button
                  type="button"
                  onClick={() =>
                    navigate({
                      to: "/app/inbox/chat/$userId",
                      params: { userId: driverUserId },
                      search: { order: orderId },
                    })
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary/40 py-3.5 text-sm text-primary"
                >
                  <MessageCircle className="h-4 w-4" /> Chat driver
                </button>
              )}
              <Link
                to="/app/buyer/orders"
                className="block text-center text-sm text-muted-foreground hover:text-foreground pt-2"
              >
                View all orders
              </Link>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
