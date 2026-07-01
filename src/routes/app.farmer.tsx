import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ArrowRight, Plus } from "lucide-react";
import { AppShell, PageHeader, StatCard } from "@/components/app/AppShell";
import { FarmerGate } from "@/components/app/RoleGate";
import { farmerOrders, listings, revenueSeries } from "@/lib/mock-data";
import { StatusBadge } from "./app.buyer";

export const Route = createFileRoute("/app/farmer")({
  head: () => ({ meta: [{ title: "Farmer · AgroLink" }] }),
  component: FarmerOverview,
});

function FarmerOverview() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/app/farmer") return <Outlet />;

  const max = Math.max(...revenueSeries.map((r) => r.ghs));
  const total = revenueSeries.reduce((s, r) => s + r.ghs, 0);

  return (
    <FarmerGate>
    <AppShell role="farmer">
      <PageHeader
        eyebrow="Overview"
        title="Good morning,"
        italic="Kwame."
        sub="Three new orders since you last checked."
        action={
          <Link to="/app/create" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> New listing
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue this week" value={`GHS ${total.toLocaleString()}`} sub="+18% vs last week" />
        <StatCard label="Active listings" value="6" sub="2 trending" tone="accent" />
        <StatCard label="Pending orders" value="3" sub="1 needs reply" />
        <StatCard label="Rating" value="4.8 ★" sub="98 reviews" />
      </div>

      <section className="mt-12 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-serif text-2xl">Revenue</h2>
              <p className="text-xs text-muted-foreground">Last 7 days · GHS</p>
            </div>
            <div className="font-serif text-3xl text-primary">GHS {total.toLocaleString()}</div>
          </div>
          <div className="mt-8 flex h-48 items-end gap-3">
            {revenueSeries.map((r) => (
              <div key={r.day} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-primary to-accent"
                  style={{ height: `${(r.ghs / max) * 100}%` }}
                />
                <span className="text-xs text-muted-foreground">{r.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl">Today's orders</h2>
            <Link to="/app/farmer/orders" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">All <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="mt-4 divide-y divide-border">
            {farmerOrders.slice(0, 4).map((o) => (
              <div key={o.id} className="py-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{o.buyer}</div>
                    <div className="truncate text-xs text-muted-foreground">{o.items}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-primary">GHS {o.totalGhs}</div>
                    <StatusBadge status={o.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl">Your listings</h2>
          <Link to="/app/farmer/listings" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">Manage <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {listings.slice(0, 4).map((l) => (
            <div key={l.id} className="overflow-hidden rounded-2xl border border-border bg-background">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={l.image} alt="" loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div className="p-4">
                <div className="truncate font-serif text-lg">{l.produce}</div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{l.quantityKg}kg</span>
                  <span className="text-primary">GHS {l.pricePerKg}/kg</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
    </FarmerGate>
  );
}
