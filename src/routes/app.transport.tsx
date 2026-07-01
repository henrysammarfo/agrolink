import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Truck, Clock, ArrowRight } from "lucide-react";
import { AppShell, PageHeader, StatCard } from "@/components/app/AppShell";
import { TransportGate } from "@/components/app/RoleGate";
import { transportJobs } from "@/lib/mock-data";
import { CorridorMap, CORRIDOR_PINS, CORRIDOR_ROUTE } from "@/components/map/CorridorMap";

export const Route = createFileRoute("/app/transport")({
  head: () => ({ meta: [{ title: "Transport · AgroLink" }] }),
  component: TransportOverview,
});

function TransportOverview() {
  const active = transportJobs.find((j) => j.status === "active");
  const available = transportJobs.filter((j) => j.status === "available");

  return (
    <TransportGate>
    <AppShell role="transport">
      <PageHeader eyebrow="Dispatch" title="Drive," italic="deliver, earn." sub="Three jobs match your van right now." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's earnings" value="GHS 280" sub="2 completed" />
        <StatCard label="Active job" value={active ? active.id : "—"} sub={active?.payload} tone="accent" />
        <StatCard label="Available jobs" value={`${available.length}`} />
        <StatCard label="Rating" value="4.9 ★" sub="62 trips" />
      </div>

      {/* Live map */}
      <section className="mt-10 overflow-hidden rounded-3xl border border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-serif text-2xl">Live corridor</h2>
            <p className="text-xs text-muted-foreground">Real-time pickup and drop-off pins</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Live
          </span>
        </div>
        <div className="h-[360px]">
          <CorridorMap pins={CORRIDOR_PINS} route={CORRIDOR_ROUTE} />
        </div>
      </section>

      {active && (
        <section className="mt-10 rounded-3xl border border-primary/40 bg-primary/5 p-6">
          <span className="text-xs uppercase tracking-widest text-primary">Active</span>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-serif text-3xl">{active.payload}</h2>
              <div className="mt-2 inline-flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {active.from} → {active.to}</span>
                <span className="inline-flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> {active.distanceKm} km</span>
                <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {active.windowLabel}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Payout</div>
                <div className="font-serif text-2xl text-primary">GHS {active.payoutGhs}</div>
              </div>
              <button className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background">Open navigation</button>
            </div>
          </div>
        </section>
      )}

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl">Job board</h2>
          <Link to="/app/transport/jobs" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">All <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {available.map((j) => (
            <div key={j.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">{j.id}</div>
                  <h3 className="mt-1 font-serif text-xl">{j.payload}</h3>
                </div>
                <div className="font-serif text-2xl text-primary">GHS {j.payoutGhs}</div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {j.from}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 text-primary" /> {j.to}</span>
                <span className="inline-flex items-center gap-1"><Truck className="h-3 w-3" /> {j.distanceKm} km</span>
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {j.windowLabel}</span>
              </div>
              <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-2.5 text-sm font-medium text-background">Accept job</button>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
    </TransportGate>
  );
}
