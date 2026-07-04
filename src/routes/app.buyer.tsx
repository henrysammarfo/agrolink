import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ArrowRight, TrendingUp } from "lucide-react";
import { AppShell, PageHeader, StatCard } from "@/components/app/AppShell";
import { LiveTrackCard } from "@/components/track/LiveTrackCard";
import { buyerOrders, listings, trackedOrders } from "@/lib/mock-data";

export const Route = createFileRoute("/app/buyer")({
  head: () => ({ meta: [{ title: "Buyer · AgroLink" }] }),
  component: BuyerOverview,
});

function BuyerOverview() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/app/buyer") return <Outlet />;

  return (
    <AppShell role="buyer">
      <PageHeader
        eyebrow="Overview"
        title="Welcome back,"
        italic="Ama."
        sub="Here's what's happening with your kitchen today."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active orders" value="2" sub="1 in transit" tone="primary" />
        <StatCard label="Spend this week" value="GHS 1,240" sub="+12% vs last week" tone="emerald" />
        <StatCard label="Saved farmers" value="6" tone="accent" />
        <StatCard label="On-time rate" value="96%" tone="amber" />
      </div>

      {/* Live order tracker */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-2xl">Track <span className="italic text-accent">live</span></h2>
          <Link to="/app/buyer/orders" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            All orders <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="space-y-5">
          {trackedOrders.slice(0, 1).map((o) => <LiveTrackCard key={o.id} order={o} />)}
        </div>
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
            {buyerOrders.slice(0, 4).map((o) => (
              <div key={o.id} className="flex items-center justify-between py-4">
                <div>
                  <div className="font-medium text-foreground">{o.items}</div>
                  <div className="text-xs text-muted-foreground">{o.id} · {o.placedAt}</div>
                </div>
                <div className="text-right">
                  <div className="font-serif text-lg text-primary">GHS {o.totalGhs}</div>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl">Recommended</h2>
            <TrendingUp className="h-4 w-4 text-accent" />
          </div>
          <div className="mt-5 space-y-3">
            {listings.slice(0, 3).map((l) => (
              <Link
                key={l.id}
                to="/app/buyer/feed"
                className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3 transition hover:border-primary/40"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                  <img src={l.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{l.produce}</div>
                  <div className="text-xs text-muted-foreground truncate">{l.farmer}</div>
                </div>
                <div className="text-sm text-primary">GHS {l.pricePerKg}</div>
              </Link>
            ))}
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
    packed: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
    shipped: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
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
