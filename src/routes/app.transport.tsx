import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Truck, Clock, Package, Check, Star, TrendingUp, Wallet, Navigation } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { TransportGate } from "@/components/app/RoleGate";
import { transportJobs } from "@/lib/mock-data";
import { CorridorMap, CORRIDOR_PINS, CORRIDOR_ROUTE } from "@/components/map/CorridorMap";

export const Route = createFileRoute("/app/transport")({
  head: () => ({ meta: [{ title: "Drive · AgroLink" }] }),
  component: TransportOverview,
});

function TransportOverview() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/app/transport") return <Outlet />;

  const [online, setOnline] = useState(true);
  const [jobs, setJobs] = useState(transportJobs);
  const active = jobs.find((j) => j.status === "accepted" || j.status === "picked_up");
  const nextAvailable = jobs.find((j) => j.status === "available");
  const featured = active ?? nextAvailable;
  const availableCount = jobs.filter((j) => j.status === "available").length;

  const acceptJob = (id: string) => {
    const job = jobs.find((j) => j.id === id);
    setJobs((curr) => curr.map((j) => (j.id === id ? { ...j, status: "accepted" } : j)));
    toast.success("Job accepted", { description: job ? `${job.from} → ${job.to}` : id });
  };
  const advance = (id: string) => {
    const job = jobs.find((j) => j.id === id);
    const next = job?.status === "accepted" ? "picked_up" : job?.status === "picked_up" ? "completed" : job?.status;
    if (!next) return;
    setJobs((curr) => curr.map((j) => (j.id === id ? { ...j, status: next } : j)));
    toast.success(next === "picked_up" ? "Pickup confirmed" : "Delivery completed");
  };

  return (
    <TransportGate>
      <AppShell role="transport">
        {/* Full-bleed map with floating overlays — Bolt-driver style */}
        <div className="relative -mx-6 -mt-6 md:-mx-10 md:-mt-10 h-[calc(100vh-140px)] min-h-[560px] overflow-hidden">
          <CorridorMap
            pins={CORRIDOR_PINS}
            route={CORRIDOR_ROUTE}
            animateDriver={online}
            driverLabel="You"
          />

          {/* Top status pill */}
          <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center px-4">
            <button
              onClick={() => setOnline((v) => !v)}
              className={`pointer-events-auto inline-flex items-center gap-3 rounded-full px-5 py-2.5 text-sm font-medium shadow-lg backdrop-blur transition ${
                online ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-background/95 text-foreground border border-border"
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${online ? "bg-white" : "bg-muted-foreground"}`}>
                {online && <span className="block h-2.5 w-2.5 rounded-full bg-white animate-ping" />}
              </span>
              {online ? "You're online" : "Go online"}
            </button>
          </div>

          {/* Right stat rail */}
          <div className="pointer-events-none absolute right-4 top-20 hidden md:flex flex-col gap-3">
            <StatChip icon={Wallet} label="Today" value="GHS 280" tone="emerald" />
            <StatChip icon={TrendingUp} label="Trips" value="2" tone="primary" />
            <StatChip icon={Star} label="Rating" value="4.9" tone="amber" />
          </div>

          {/* Bottom sheet */}
          <div className="absolute inset-x-0 bottom-0 px-3 md:px-6 pb-4">
            <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-background/95 p-5 shadow-2xl backdrop-blur">
              {featured ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] uppercase tracking-widest ${
                      active ? "text-primary" : "text-emerald-600 dark:text-emerald-400"
                    }`}>
                      {active ? "Active job" : "Next available"}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">{featured.id}</span>
                  </div>
                  <div className="mt-2 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="font-serif text-2xl truncate">{featured.payload}</h2>
                      <div className="mt-1 text-xs text-muted-foreground inline-flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 text-rose-500" /> {featured.from}</span>
                        <Navigation className="h-3 w-3 text-primary" />
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 text-primary" /> {featured.to}</span>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground inline-flex items-center gap-3">
                        <span className="inline-flex items-center gap-1"><Truck className="h-3 w-3" /> {featured.distanceKm} km</span>
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {featured.windowLabel}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-serif text-3xl text-primary">GHS {featured.payoutGhs}</div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Paid on MoMo</div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    {featured.status === "available" && (
                      <button onClick={() => acceptJob(featured.id)} className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 py-3 text-sm font-semibold text-white hover:bg-emerald-600">
                        <Check className="h-4 w-4" /> Accept — GHS {featured.payoutGhs}
                      </button>
                    )}
                    {featured.status === "accepted" && (
                      <button onClick={() => advance(featured.id)} className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                        <Package className="h-4 w-4" /> Confirm pickup
                      </button>
                    )}
                    {featured.status === "picked_up" && (
                      <button onClick={() => advance(featured.id)} className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700">
                        <Truck className="h-4 w-4" /> Mark delivered
                      </button>
                    )}
                    <Link to="/app/transport/jobs" className="rounded-full border border-border px-4 py-3 text-sm text-muted-foreground hover:text-foreground">
                      {availableCount} more
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="font-serif text-xl">All caught up.</div>
                  <div className="mt-1 text-sm text-muted-foreground">New jobs on this corridor appear here automatically.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    </TransportGate>
  );
}

function StatChip({ icon: Icon, label, value, tone }: { icon: typeof Wallet; label: string; value: string; tone: "primary" | "emerald" | "amber" }) {
  const toneCls =
    tone === "emerald" ? "text-emerald-600 dark:text-emerald-400"
    : tone === "amber" ? "text-amber-500"
    : "text-primary";
  return (
    <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-background/95 px-4 py-2.5 shadow-lg backdrop-blur">
      <Icon className={`h-4 w-4 ${toneCls}`} />
      <div>
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className={`font-serif text-sm ${toneCls}`}>{value}</div>
      </div>
    </div>
  );
}
