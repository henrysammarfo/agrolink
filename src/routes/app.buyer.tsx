import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ArrowRight, TrendingUp } from "lucide-react";
import { AppShell, PageHeader, StatCard } from "@/components/app/AppShell";
import { LiveTrackCard } from "@/components/track/LiveTrackCard";
import { useAuth } from "@/lib/auth";
import { useBuyerOrders, useFeedTeaser } from "@/hooks/use-marketplace";
import { FeedTeaserSkeleton } from "@/components/feed/FeedSkeleton";
import { MARKETING_FALLBACK_IMAGE } from "@/lib/config/site";

export const Route = createFileRoute("/app/buyer")({
  head: () => ({ meta: [{ title: "Buyer · AgroLink" }] }),
  component: BuyerOverview,
});

function BuyerOverview() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, profile } = useAuth();
  const { data: orders = [], isLoading } = useBuyerOrders(user?.id);
  const { data: feed = [], isLoading: feedLoading } = useFeedTeaser(3);

  if (pathname !== "/app/buyer") return <Outlet />;

  const active = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const trackingStatuses = ["driver_assigned", "driver_enroute_pickup", "picked_up", "enroute_delivery"];
  const inTransit = active.filter(
    (o) => o.status === "dispatched" || trackingStatuses.includes(o.delivery?.status ?? ""),
  );
  const weekSpend = orders
    .filter((o) => {
      const d = new Date(o.created_at);
      return Date.now() - d.getTime() < 7 * 86400000 && o.payment_status === "paid";
    })
    .reduce((s, o) => s + Number(o.total_amount), 0);

  const name = profile?.display_name?.split(" ")[0] ?? "there";

  return (
    <AppShell role="buyer">
      <PageHeader
        eyebrow="Overview"
        title="Welcome back,"
        italic={`${name}.`}
        sub="Here's what's happening with your kitchen today."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active orders" value={String(active.length)} sub={inTransit.length ? `${inTransit.length} in transit` : undefined} tone="primary" />
        <StatCard label="Spend this week" value={`GHS ${weekSpend.toLocaleString()}`} tone="emerald" />
        <StatCard label="Total orders" value={String(orders.length)} tone="accent" />
        <StatCard label="Paid orders" value={String(orders.filter((o) => o.payment_status === "paid").length)} tone="amber" />
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-2xl">Track <span className="italic text-accent">live</span></h2>
          <Link to="/app/buyer/orders" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            All orders <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {isLoading ? (
          <FeedTeaserSkeleton />
        ) : (
          <div className="space-y-5">
            {inTransit.slice(0, 1).map((o) => (
              <LiveTrackCard key={o.id} order={o} />
            ))}
            {inTransit.length === 0 && active.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No active deliveries — browse the feed to order.
              </div>
            )}
          </div>
        )}
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl">Recent <span className="italic text-primary">orders</span></h2>
            <Link to="/app/buyer/orders" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-5 divide-y divide-border">
            {orders.slice(0, 4).map((o) => (
              <div key={o.id} className="flex items-center justify-between py-4">
                <div>
                  <div className="font-medium text-foreground">
                    {o.items?.map((i) => i.listing?.title).filter(Boolean).join(" · ") || "Order"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-serif text-lg text-primary">GHS {o.total_amount}</div>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">No orders yet.</div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl">Recommended</h2>
            <TrendingUp className="h-4 w-4 text-accent" />
          </div>
          <div className="mt-5 space-y-3">
            {feedLoading ? (
              <FeedTeaserSkeleton />
            ) : (
              feed.map((l) => (
              <Link
                key={l.id}
                to="/app/buyer/feed"
                className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3 transition hover:border-primary/40"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                  <img src={l.image_url ?? MARKETING_FALLBACK_IMAGE} alt="" loading="lazy" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{l.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{l.seller_name}</div>
                </div>
                <div className="text-sm text-primary">GHS {l.price_per_unit}</div>
              </Link>
            ))
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    confirmed: "bg-accent/20 text-accent",
    processing: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
    dispatched: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    in_transit: "bg-primary/20 text-primary",
    delivered: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    cancelled: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
  };
  return (
    <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${map[status] ?? ""}`}>
      {status.replace("_", " ")}
    </span>
  );
}
