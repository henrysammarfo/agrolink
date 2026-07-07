import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { MapPin, Truck, Clock, Package, Check, Navigation, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatCard } from "@/components/app/AppShell";
import { TransportGate, VerifiedTransportGate } from "@/components/app/RoleGate";
import { JobAcceptCountdown } from "@/components/transport/JobAcceptCountdown";
import { PodCaptureSheet } from "@/components/transport/PodCaptureSheet";
import { SlideToConfirm } from "@/components/ui/SlideToConfirm";
import { CorridorMap } from "@/components/map/CorridorMap";
import { useAuth } from "@/lib/auth";
import { useDriverProfile, useDriverEarnings } from "@/hooks/use-marketplace";
import { trackEvent } from "@/lib/analytics";
import { apiFetch } from "@/lib/api/fetch-auth";
import {
  fetchAvailableDeliveries, fetchDriverDeliveries, acceptDelivery, advanceDeliveryStatus,
  completeDeliveryViaApi,
} from "@/lib/api/orders";
import {
  updateDriverAvailability, startDriverLocationWatch, fetchOsrmRoute,
} from "@/lib/api/driver";
import type { DeliveryRow } from "@/lib/types/marketplace";

export const Route = createFileRoute("/app/transport")({
  head: () => ({ meta: [{ title: "Drive · AgroLink" }] }),
  component: TransportOverview,
});

function TransportOverview() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isIndex = pathname === "/app/transport";

  const { user } = useAuth();
  const { data: driverProfile, refetch } = useDriverProfile(user?.id);
  const { data: earnings } = useDriverEarnings(user?.id);
  const [jobs, setJobs] = useState<DeliveryRow[]>([]);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(true);
  const [podJob, setPodJob] = useState<DeliveryRow | null>(null);

  const online = driverProfile?.available ?? false;
  const active = jobs.find((j) => ["driver_assigned", "driver_enroute_pickup", "picked_up", "enroute_delivery"].includes(j.status));
  const nextAvailable = jobs.find((j) => j.status === "requested" && !j.driver_id);
  const featured = active ?? nextAvailable;

  const loadJobs = useCallback(async () => {
    if (!driverProfile?.id) { setLoading(false); return; }
    try {
      const [available, mine] = await Promise.all([
        fetchAvailableDeliveries(),
        fetchDriverDeliveries(driverProfile.id),
      ]);
      setJobs([...mine, ...available.filter((a) => !mine.find((m) => m.id === a.id))]);
    } catch (e) {
      console.warn("[Transport] load jobs failed", e);
    } finally {
      setLoading(false);
    }
  }, [driverProfile?.id]);

  useEffect(() => {
    if (!user?.id || !isIndex) return;
    loadJobs();
    const interval = setInterval(loadJobs, 15_000);
    const reassign = setInterval(() => apiFetch("/api/deliveries/reassign-expired").catch(() => {}), 10_000);
    return () => {
      clearInterval(interval);
      clearInterval(reassign);
    };
  }, [user?.id, isIndex, loadJobs]);

  useEffect(() => {
    if (!user?.id || !online || !isIndex) return;
    return startDriverLocationWatch(user.id, () => {});
  }, [user?.id, online, isIndex]);

  useEffect(() => {
    if (!featured || !isIndex) return;
    fetchOsrmRoute(
      { lat: featured.pickup_lat, lng: featured.pickup_lng },
      { lat: featured.delivery_lat, lng: featured.delivery_lng },
    ).then((r) => { if (r) setRouteCoords(r.coordinates); });
  }, [featured?.id, featured?.pickup_lat, featured?.pickup_lng, featured?.delivery_lat, featured?.delivery_lng, isIndex]);

  if (!isIndex) return <Outlet />;

  const toggleOnline = async () => {
    if (!user?.id) return;
    try {
      await updateDriverAvailability(user.id, !online);
      refetch();
      trackEvent("driver_online_toggle", { online: !online });
      toast.success(online ? "You are offline" : "You are online");
    } catch { toast.error("Could not update status"); }
  };

  const acceptJob = async (id: string) => {
    if (!driverProfile?.id) return;
    try {
      await acceptDelivery(id, driverProfile.id);
      trackEvent("driver_job_accept", { delivery_id: id });
      toast.success("Job accepted");
      loadJobs();
    } catch { toast.error("Could not accept job"); }
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
    if (status === "delivered") {
      setPodJob(job);
      return;
    }
    try {
      await advanceDeliveryStatus(job.id, status);
      trackEvent("driver_status_advance", { delivery_id: job.id, status });
      toast.success("Status updated");
      loadJobs();
    } catch { toast.error("Could not update status"); }
  };

  const finishWithPod = async (podPhotoUrl: string) => {
    if (!podJob || !user?.id) return;
    try {
      await completeDeliveryViaApi(podJob.id, user.id, podPhotoUrl);
      trackEvent("driver_delivery_complete", { delivery_id: podJob.id, source: "map" });
      toast.success("Delivery completed — POD saved, payouts sent!");
      setPodJob(null);
      loadJobs();
    } catch {
      toast.error("Could not complete delivery");
      throw new Error("complete failed");
    }
  };

  const mapPins = featured ? [
    { lat: featured.pickup_lat, lng: featured.pickup_lng, label: "Pickup", kind: "farm" as const },
    { lat: featured.delivery_lat, lng: featured.delivery_lng, label: "Dropoff", kind: "buyer" as const },
    ...(driverProfile?.current_lat ? [{ lat: driverProfile.current_lat, lng: driverProfile.current_lng!, label: "You", kind: "driver" as const }] : []),
  ] : [];

  const slideLabel =
    featured?.status === "driver_enroute_pickup"
      ? "Slide to confirm pickup"
      : featured?.status === "enroute_delivery"
        ? "Slide to confirm delivery"
        : null;

  return (
    <VerifiedTransportGate>
      <AppShell role="transport">
        <div className="relative -mx-6 -mt-6 md:-mx-10 md:-mt-10 h-[calc(100vh-140px)] min-h-[560px] overflow-hidden">
          <CorridorMap pins={mapPins} route={routeCoords} animateDriver={false} driverLabel="You" dark />

          <div className="pointer-events-none absolute inset-x-0 top-4 flex flex-col items-center gap-3 px-4">
            <button onClick={toggleOnline} className={`pointer-events-auto inline-flex items-center gap-3 rounded-full px-5 py-2.5 text-sm font-medium shadow-lg backdrop-blur transition ${online ? "bg-emerald-500 text-white" : "bg-background/95 text-foreground border border-border"}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${online ? "bg-white animate-ping" : "bg-muted-foreground"}`} />
              {online ? "You're online" : "Go online"}
            </button>
            {earnings && (
              <div className="pointer-events-auto grid w-full max-w-xs grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-black/60 p-3 text-white backdrop-blur">
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-widest text-white/60">Today</div>
                  <div className="font-sans text-lg font-bold">GHS {earnings.today.toFixed(0)}</div>
                </div>
                <div className="text-center border-x border-white/10">
                  <div className="text-[10px] uppercase tracking-widest text-white/60">Week</div>
                  <div className="font-sans text-lg font-bold">GHS {earnings.week.toFixed(0)}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-widest text-white/60">Trips</div>
                  <div className="font-sans text-lg font-bold">{earnings.trips}</div>
                </div>
              </div>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 px-3 md:px-6 pb-4">
            <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-background/95 p-5 shadow-2xl backdrop-blur">
              {loading ? (
                <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : featured ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-primary">{active ? "Active job" : "Available job"}</span>
                    {featured.status === "requested" && featured.accept_deadline && (
                      <JobAcceptCountdown deadline={featured.accept_deadline} onExpired={loadJobs} compact />
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="text-xs text-muted-foreground inline-flex flex-wrap items-center gap-x-3">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 text-rose-500" /> {featured.pickup_address}</span>
                      <Navigation className="h-3 w-3 text-primary" />
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 text-primary" /> {featured.delivery_address}</span>
                    </div>
                    {featured.estimated_distance_km && (
                      <div className="mt-2 text-xs text-muted-foreground inline-flex items-center gap-1"><Truck className="h-3 w-3" /> {featured.estimated_distance_km} km · <Clock className="h-3 w-3 ml-2" /> {featured.status.replace(/_/g, " ")}</div>
                    )}
                  </div>
                  <div className="mt-4 flex flex-col gap-3">
                    {featured.status === "requested" && featured.accept_deadline && (
                      <JobAcceptCountdown deadline={featured.accept_deadline} onExpired={loadJobs} />
                    )}
                    {slideLabel ? (
                      <SlideToConfirm
                        label={slideLabel}
                        tone={featured.status === "enroute_delivery" ? "blue" : "primary"}
                        onConfirm={() => advance(featured)}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        {featured.status === "requested" && (
                          <button onClick={() => acceptJob(featured.id)} className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 py-3 text-sm font-semibold text-white"><Check className="h-4 w-4" /> Accept job</button>
                        )}
                        {featured.status === "driver_assigned" && (
                          <button onClick={() => advance(featured)} className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground"><Navigation className="h-4 w-4" /> En route to pickup</button>
                        )}
                        {featured.status === "picked_up" && (
                          <button onClick={() => advance(featured)} className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 py-3 text-sm font-semibold text-white"><Truck className="h-4 w-4" /> En route to buyer</button>
                        )}
                        <Link to="/app/transport/jobs" className="rounded-full border border-border px-4 py-3 text-sm text-muted-foreground">All jobs</Link>
                      </div>
                    )}
                    {slideLabel && (
                      <Link to="/app/transport/jobs" className="block text-center text-xs text-muted-foreground hover:text-foreground">All jobs</Link>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <Wallet className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <div className="mt-2 font-sans text-lg font-semibold">{online ? "Waiting for jobs…" : "Go online to receive jobs"}</div>
                  {earnings && earnings.week > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">GHS {earnings.week.toFixed(2)} earned this week</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </AppShell>
      {user?.id && podJob && (
        <PodCaptureSheet
          open
          deliveryId={podJob.id}
          userId={user.id}
          onClose={() => setPodJob(null)}
          onComplete={finishWithPod}
        />
      )}
    </VerifiedTransportGate>
  );
}
