import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, RotateCcw, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { StatusBadge } from "./app.buyer";
import { LiveTrackCard } from "@/components/track/LiveTrackCard";
import { OrderTracker } from "@/components/order/OrderTracker";
import { FeedSkeleton } from "@/components/feed/FeedSkeleton";
import { useAuth } from "@/lib/auth";
import { useBuyerOrders, useReorderCart } from "@/hooks/use-marketplace";
import { buildTrackedOrder } from "@/lib/types/fulfillment";
import { isOrderActive } from "@/lib/order-lifecycle";

export const Route = createFileRoute("/app/buyer/orders")({
  head: () => ({ meta: [{ title: "Orders · AgroLink" }] }),
  component: Orders,
});

function Orders() {
  const { user, loading: authLoading } = useAuth();
  const { data: orders = [], isLoading, isError, error, refetch } = useBuyerOrders(user?.id);
  const reorder = useReorderCart();
  const [tab, setTab] = useState<"active" | "history">("active");
  const [q, setQ] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activeOrders = orders.filter(isOrderActive);
  const historyOrders = orders
    .filter((o) => !isOrderActive(o))
    .filter((o) => !q || o.id.includes(q));

  const handleReorder = async (orderId: string) => {
    if (!user?.id) return;
    const order = orders.find((o) => o.id === orderId);
    if (!order?.items?.length) {
      toast.error("No items to reorder");
      return;
    }
    try {
      const count = await reorder.mutateAsync({ userId: user.id, order });
      toast.success(`Added ${count} item${count !== 1 ? "s" : ""} to cart`, {
        action: { label: "View cart", onClick: () => { window.location.href = "/app/buyer/cart"; } },
      });
    } catch {
      toast.error("Could not reorder");
    }
  };

  return (
    <AppShell role="buyer">
      <PageHeader
        eyebrow="History"
        title="Your"
        italic="orders"
        sub="Follow the driver live, then keep every receipt in one place."
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-border bg-card p-1 text-sm">
          {(["active", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 capitalize transition ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t}{" "}
              {t === "active" && activeOrders.length > 0 && (
                <span className="ml-1 opacity-80">· {activeOrders.length}</span>
              )}
            </button>
          ))}
        </div>
        {tab === "history" && (
          <label className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            <Search className="h-3.5 w-3.5" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search past orders"
              className="w-48 bg-transparent outline-none text-foreground"
            />
          </label>
        )}
      </div>

      {authLoading || isLoading ? (
        <FeedSkeleton />
      ) : isError ? (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-8 text-center">
          <p className="text-sm text-rose-700 dark:text-rose-300">
            {error instanceof Error ? error.message : "Could not load orders"}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 rounded-full bg-foreground px-5 py-2 text-sm text-background"
          >
            Retry
          </button>
        </div>
      ) : tab === "active" ? (
        <div className="space-y-6">
          {activeOrders.map((o) => (
            <div key={o.id} className="space-y-4">
              <LiveTrackCard order={o} />
              <button
                onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}
                className="text-xs text-primary hover:underline"
              >
                {expandedId === o.id ? "Hide" : "Show"} fulfillment timeline
              </button>
              {expandedId === o.id && (
                <OrderTracker order={buildTrackedOrder(o)} sourceOrder={o} showPayment showFullPipeline />
              )}
            </div>
          ))}
          {activeOrders.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No active orders — new checkouts appear here under the Active tab.
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-5 py-4 text-left">Order</th>
                <th className="px-5 py-4 text-left">Placed</th>
                <th className="px-5 py-4 text-right">Total</th>
                <th className="px-5 py-4 text-right">Payment</th>
                <th className="px-5 py-4 text-right">Status</th>
                <th className="px-5 py-4 text-right" />
              </tr>
            </thead>
            <tbody>
              {historyOrders.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-4 font-mono text-xs">{o.id.slice(0, 8)}</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 text-right font-sans font-semibold">GHS {o.total_amount}</td>
                  <td className="px-5 py-4 text-right text-xs capitalize">{o.payment_status}</td>
                  <td className="px-5 py-4 text-right">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to="/app/buyer/orders/$orderId/track"
                        params={{ orderId: o.id }}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        Track <ArrowRight className="h-3 w-3" />
                      </Link>
                      <button
                        onClick={() => handleReorder(o.id)}
                        disabled={reorder.isPending}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:bg-secondary"
                      >
                        <RotateCcw className="h-3 w-3" /> Reorder
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {historyOrders.length === 0 && (
            <div className="p-10 text-center text-muted-foreground">No past orders yet.</div>
          )}
        </div>
      )}
    </AppShell>
  );
}
