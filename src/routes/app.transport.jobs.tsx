import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Truck, Clock } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { transportJobs } from "@/lib/mock-data";

export const Route = createFileRoute("/app/transport/jobs")({
  head: () => ({ meta: [{ title: "Jobs · AgroLink" }] }),
  component: Jobs,
});

function Jobs() {
  return (
    <AppShell role="transport">
      <PageHeader eyebrow="Job board" title="All" italic="jobs" sub="Live, active and completed." />
      <div className="space-y-3">
        {transportJobs.map((j) => (
          <div key={j.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
                {j.id} · <span className={j.status === "active" ? "text-primary" : j.status === "available" ? "text-accent" : "text-muted-foreground"}>{j.status}</span>
              </div>
              <h3 className="mt-1 font-serif text-xl">{j.payload}</h3>
              <div className="mt-2 inline-flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {j.from} → {j.to}</span>
                <span className="inline-flex items-center gap-1"><Truck className="h-3 w-3" /> {j.distanceKm} km</span>
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {j.windowLabel}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="font-serif text-2xl text-primary">GHS {j.payoutGhs}</div>
              </div>
              {j.status === "available" && (
                <button className="rounded-full bg-foreground px-4 py-2 text-sm text-background">Accept</button>
              )}
              {j.status === "active" && (
                <button className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">Open map</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
