import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { StatusBadge } from "./app.buyer";
import { LiveTrackCard } from "@/components/track/LiveTrackCard";
import { OrderTracker } from "@/components/order/OrderTracker";
import { FeedSkeleton } from "@/components/feed/FeedSkeleton";
import { useAuth } from "@/lib/auth";
import { useBuyerOrders, useReorderCart } from "@/hooks/use-marketplace";
import { buildTrackedOrder } from "@/lib/types/fulfillment";

export const Route = createFileRoute("/app/buyer/orders")({
  head: () => ({ meta: [{ title: "Orders · AgroLink" }] }),
  component: Orders,
});

function Orders() {
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useBuyerOrders(user?.id);
  const reorder = useReorderCart();
  const [tab, setTab] = useState<"active" | "history">("active");
  const [q, setQ] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activeOrders = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const historyOrders = orders
    .filter((o) => ["delivered", "cancelled"].includes(o.status))
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

      {isLoading ? (
        <FeedSkeleton />
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
              {expandedId === o.id && <OrderTracker order={buildTrackedOrder(o)} />}
            </div>
          ))}
          {activeOrders.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No active orders — head to the feed to grab something fresh.
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
                  <td className="px-5 py-4 text-right">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleReorder(o.id)}
                      disabled={reorder.isPending}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:bg-secondary"
                    >
                      <RotateCcw className="h-3 w-3" /> Reorder
                    </button>
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
