import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { MapPin, Truck, Clock, Check, Package, Loader2, Navigation } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { VerifiedTransportGate } from "@/components/app/RoleGate";
import { JobAcceptCountdown } from "@/components/transport/JobAcceptCountdown";
import { useAuth } from "@/lib/auth";
import { useDriverProfile, useTransportJobs } from "@/hooks/use-marketplace";
import { acceptDelivery, advanceDeliveryStatus, completeDeliveryViaApi } from "@/lib/api/orders";
import type { DeliveryRow } from "@/lib/types/marketplace";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/app/transport/jobs")({
  head: () => ({ meta: [{ title: "Jobs · AgroLink" }] }),
  component: Jobs,
});

const STATUS_MAP: Record<string, { label: string; tone: string }> = {
  requested: { label: "Available", tone: "text-emerald-600 dark:text-emerald-400" },
  driver_assigned: { label: "Accepted", tone: "text-primary" },
  driver_enroute_pickup: { label: "En route pickup", tone: "text-primary" },
  picked_up: { label: "Picked up", tone: "text-blue-600 dark:text-blue-400" },
  enroute_delivery: { label: "En route", tone: "text-blue-600 dark:text-blue-400" },
  delivered: { label: "Delivered", tone: "text-muted-foreground" },
};

function Jobs() {
  const { user } = useAuth();
  const { data: driver } = useDriverProfile(user?.id);
  const { data: jobs = [], isLoading } = useTransportJobs(driver?.id);
  const [filter, setFilter] = useState<"all" | "requested" | "active" | "delivered">("all");
  const qc = useQueryClient();

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["transport-jobs", driver?.id] });
  }, [qc, driver?.id]);

  useEffect(() => {
    const poll = () => fetch("/api/deliveries/reassign-expired").catch(() => {});
    poll();
    const id = setInterval(poll, 10_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!driver?.id) return;
    const id = setInterval(refresh, 5_000);
    return () => clearInterval(id);
  }, [driver?.id, refresh]);

  const visible = jobs.filter((j) => {
    if (filter === "all") return true;
    if (filter === "requested") return j.status === "requested";
    if (filter === "delivered") return j.status === "delivered";
    return !["requested", "delivered", "cancelled"].includes(j.status);
  });

  const accept = async (id: string) => {
    if (!driver?.id) return;
    try {
      await acceptDelivery(id, driver.id);
      toast.success("Job accepted");
      refresh();
    } catch {
      toast.error("Could not accept");
    }
  };

  const advance = async (job: DeliveryRow) => {
    const next: Record<string, string> = {
      driver_assigned: "driver_enroute_pickup",
      driver_enroute_pickup: "picked_up",
      picked_up: "enroute_delivery",
      enroute_delivery: "delivered",
    };
    const status = next[job.status];
    if (!status) return;
    try {
      if (status === "delivered" && user?.id) {
        await completeDeliveryViaApi(job.id, user.id);
        toast.success("Completed — farmer & driver paid via Paystack Transfer");
      } else {
        await advanceDeliveryStatus(job.id, status);
      }
      refresh();
    } catch {
      toast.error("Could not update");
    }
  };

  return (
    <VerifiedTransportGate>
    <AppShell role="transport">
      <PageHeader
        eyebrow="Job board"
        title="Pick a"
        italic="run"
        sub="Bolt-style job list — accept, pick up, earn on MoMo."
        action={
          <div className="flex gap-2">
            {(["all", "requested", "active", "delivered"] as const).map((f) => (
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
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
      <div className="space-y-3">
        {visible.map((j) => {
          const st = STATUS_MAP[j.status] ?? { label: j.status, tone: "" };
          const payout = j.delivery_fee ?? (j.estimated_distance_km ? Math.round(Number(j.estimated_distance_km) * 2.5 + 15) : null);
          return (
          <div key={j.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between shadow-sm">
            <div className="min-w-0">
              <div className="flex items-center gap-3 text-xs uppercase tracking-widest flex-wrap">
                <span className="font-mono text-primary/80">{j.id.slice(0, 8)}</span>
                <span className={st.tone}>{st.label}</span>
                {j.status === "requested" && j.accept_deadline && (
                  <JobAcceptCountdown deadline={j.accept_deadline} onExpired={refresh} compact />
                )}
              </div>
              <h3 className="mt-1 font-serif text-xl">{j.pickup_address} → {j.delivery_address}</h3>
              {j.pickup_stops && j.pickup_stops.length > 1 && (
                <p className="mt-1 text-xs text-primary">{j.pickup_stops.length} co-op farm stops</p>
              )}
              <div className="mt-2 inline-flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 text-rose-500" /> Produce run</span>
                {j.estimated_distance_km != null && (
                  <span className="inline-flex items-center gap-1"><Truck className="h-3 w-3 text-amber-600" /> {Number(j.estimated_distance_km).toFixed(1)} km</span>
                )}
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3 text-accent" /> {new Date(j.created_at).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-serif text-2xl text-primary">{payout != null ? `GHS ${payout}` : "—"}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Driver payout</div>
              </div>
              {j.status === "requested" && (
                <button onClick={() => accept(j.id)} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700">
                  <Check className="h-4 w-4" /> Accept
                </button>
              )}
              {j.status === "driver_assigned" && (
                <button onClick={() => advance(j)} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">
                  <Navigation className="h-4 w-4" /> En route
                </button>
              )}
              {j.status === "driver_enroute_pickup" && (
                <button onClick={() => advance(j)} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">
                  <Package className="h-4 w-4" /> Picked up
                </button>
              )}
              {(j.status === "picked_up" || j.status === "enroute_delivery") && j.status !== "delivered" && (
                <button onClick={() => advance(j)} className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm text-white">
                  <Truck className="h-4 w-4" /> Deliver
                </button>
              )}
              {j.status === "delivered" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-700">
                  <Check className="h-3 w-3" /> Done
                </span>
              )}
            </div>
          </div>
        );})}
        {visible.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No {filter} jobs right now. Stay online on the map.
          </div>
        )}
      </div>
      )}
    </AppShell>
    </VerifiedTransportGate>
  );
}
