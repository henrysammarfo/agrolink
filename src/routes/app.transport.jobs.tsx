import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Truck, Clock, Check, Package } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { TransportGate } from "@/components/app/RoleGate";
import { transportJobs, type TransportJob } from "@/lib/mock-data";

export const Route = createFileRoute("/app/transport/jobs")({
  head: () => ({ meta: [{ title: "Jobs · AgroLink" }] }),
  component: Jobs,
});

const STATUS_TONE: Record<TransportJob["status"], string> = {
  available: "text-emerald-600 dark:text-emerald-400",
  active: "text-primary",
  completed: "text-muted-foreground",
};

function Jobs() {
  const [jobs, setJobs] = useState(transportJobs);
  const [filter, setFilter] = useState<"all" | TransportJob["status"]>("all");

  const setStatus = (id: string, status: TransportJob["status"]) =>
    setJobs((curr) => curr.map((j) => (j.id === id ? { ...j, status } : j)));

  const visible = filter === "all" ? jobs : jobs.filter((j) => j.status === filter);

  return (
    <TransportGate>
    <AppShell role="transport">
      <PageHeader
        eyebrow="Job board"
        title="Pick a"
        italic="run"
        sub="Accept, pick up, and earn same-day on MoMo."
        action={
          <div className="flex gap-2">
            {(["all", "available", "active", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full border px-3 py-1.5 text-xs capitalize ${
                  filter === f ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        }
      />
      <div className="space-y-3">
        {visible.map((j) => (
          <div key={j.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3 text-xs uppercase tracking-widest">
                <span className="font-mono text-primary/80">{j.id}</span>
                <span className={STATUS_TONE[j.status]}>{j.status}</span>
              </div>
              <h3 className="mt-1 font-serif text-xl">{j.payload}</h3>
              <div className="mt-2 inline-flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 text-rose-500" /> {j.from} → <span className="text-foreground">{j.to}</span></span>
                <span className="inline-flex items-center gap-1"><Truck className="h-3 w-3 text-amber-600" /> {j.distanceKm} km</span>
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3 text-accent" /> {j.windowLabel}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-serif text-2xl text-primary">GHS {j.payoutGhs}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Paid on MoMo</div>
              </div>
              {j.status === "available" && (
                <button onClick={() => setStatus(j.id, "active")} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700">
                  <Check className="h-4 w-4" /> Accept
                </button>
              )}
              {j.status === "active" && (
                <>
                  <button onClick={() => setStatus(j.id, "completed")} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
                    <Package className="h-4 w-4" /> Mark delivered
                  </button>
                </>
              )}
              {j.status === "completed" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-300">
                  <Check className="h-3 w-3" /> Done
                </span>
              )}
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No {filter} jobs right now. Pull down to refresh.
          </div>
        )}
      </div>
    </AppShell>
    </TransportGate>
  );
}
