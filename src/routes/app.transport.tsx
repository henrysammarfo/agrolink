import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { Truck, Radio, Loader2, Sprout } from "lucide-react";
import { dialPhone, pickBuyerPhone } from "@/lib/trip-contact";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { VerifiedTransportGate } from "@/components/app/RoleGate";
import { JobOfferSheet } from "@/components/transport/JobOfferSheet";
import { DriverNavHud } from "@/components/transport/DriverNavHud";
import { TransportTripSheet } from "@/components/transport/TransportTripSheet";
import { PodCaptureSheet } from "@/components/transport/PodCaptureSheet";
import { CorridorMap } from "@/components/map/CorridorMap";
import { useAuth } from "@/lib/auth";
import { useDriverProfile, useDriverEarnings } from "@/hooks/use-marketplace";
import { trackEvent } from "@/lib/analytics";
import { apiFetch } from "@/lib/api/fetch-auth";
import {
  acceptDelivery, declineDelivery, advanceDeliveryStatus,
  completeDeliveryViaApi,
} from "@/lib/api/orders";
import { loadTransportJobs } from "@/lib/api/transport-jobs";
import {
  updateDriverAvailability, startDriverLocationWatch, fetchDrivingRoute, goOnlineWithLocation,
} from "@/lib/api/driver";
import type { RouteStep } from "@/lib/api/maps";
import { filterJobsForDriver } from "@/lib/driver-jobs";
import { buildTrafficSegments, estimateDriverPayout } from "@/lib/route-display";
import { ACCRA_CENTER, DEFAULT_MAP_ZOOM, isValidMapCoord, STREET_ZOOM } from "@/lib/map-coords";
import { vehicleToFilterBucket } from "@/lib/vehicle-types";
import type { DeliveryRow } from "@/lib/types/marketplace";

export const Route = createFileRoute("/app/transport")({
  head: () => ({ meta: [{ title: "Drive · AgroLink" }] }),
  component: TransportOverview,
});

function TransportOverview() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isIndex = pathname === "/app/transport";
  const navigate = useNavigate();

  const { user } = useAuth();
  const { data: driverProfile, refetch } = useDriverProfile(user?.id);
  const { data: earnings } = useDriverEarnings(user?.id);
  const [jobs, setJobs] = useState<DeliveryRow[]>([]);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeMeta, setRouteMeta] = useState<{
    distance_km: number;
    duration_min: number;
    duration_in_traffic_min?: number;
    source: "mapbox" | "osrm" | "haversine";
    steps: RouteStep[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [podJob, setPodJob] = useState<DeliveryRow | null>(null);
  const [offerJob, setOfferJob] = useState<DeliveryRow | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [livePos, setLivePos] = useState<{ lat: number; lng: number } | null>(null);
  const [navMuted, setNavMuted] = useState(false);
  const seenOfferIds = useRef<Set<string>>(new Set());

  const online = driverProfile?.available ?? false;
  const active = jobs.find((j) => ["driver_assigned", "driver_enroute_pickup", "picked_up", "enroute_delivery"].includes(j.status));
  const availableJobs = useMemo(
    () => filterJobsForDriver(jobs, driverProfile ?? undefined, "all"),
    [jobs, driverProfile],
  );
  const nextAvailable = availableJobs[0];
  const featured = active ?? nextAvailable;
  const vehicleLabel = vehicleToFilterBucket(driverProfile?.vehicle_type);

  const driverCenter = useMemo(() => {
    if (livePos && isValidMapCoord(livePos.lat, livePos.lng)) return [livePos.lat, livePos.lng] as [number, number];
    if (driverProfile?.current_lat != null && driverProfile.current_lng != null && isValidMapCoord(driverProfile.current_lat, driverProfile.current_lng)) {
      return [driverProfile.current_lat, driverProfile.current_lng] as [number, number];
    }
    return ACCRA_CENTER;
  }, [livePos, driverProfile?.current_lat, driverProfile?.current_lng]);

  const loadJobs = useCallback(async (showToastOnError = false) => {
    if (!driverProfile?.id) {
      setLoading(false);
      return;
    }
    try {
      const next = await loadTransportJobs(driverProfile.id);
      setJobs(next);
      setJobsError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not load jobs";
      console.warn("[Transport] load jobs failed", e);
      setJobsError(msg);
      if (showToastOnError) toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [driverProfile?.id]);

  useEffect(() => {
    if (!user?.id || !isIndex) return;
    void loadJobs(true);
    const interval = setInterval(() => loadJobs(false), 12_000);
    const reassign = setInterval(() => apiFetch("/api/deliveries/reassign-expired").catch(() => {}), 10_000);
    return () => {
      clearInterval(interval);
      clearInterval(reassign);
    };
  }, [user?.id, isIndex, loadJobs]);

  useEffect(() => {
    if (!user?.id || !online || !isIndex) return;
    return startDriverLocationWatch(user.id, (lat, lng) => {
      if (isValidMapCoord(lat, lng)) setLivePos({ lat, lng });
    });
  }, [user?.id, online, isIndex]);

  useEffect(() => {
    if (!nextAvailable || active || !online) return;
    if (nextAvailable.status !== "requested") return;
    if (seenOfferIds.current.has(nextAvailable.id)) return;
    seenOfferIds.current.add(nextAvailable.id);
    setOfferJob(nextAvailable);
  }, [nextAvailable?.id, nextAvailable?.status, active, online]);

  const routeSegments = useMemo(
    () => buildTrafficSegments(routeCoords, routeMeta?.steps),
    [routeCoords, routeMeta?.steps],
  );

  const routeFitKey = featured?.id
    ? `${featured.id}-${featured.status}-${routeCoords.length}`
    : "idle";

  const lastRouteOriginRef = useRef<{ lat: number; lng: number; status: string } | null>(null);

  useEffect(() => {
    if (!featured || !isIndex) {
      setRouteCoords([]);
      setRouteMeta(null);
      lastRouteOriginRef.current = null;
      return;
    }

    const pickupOk = isValidMapCoord(featured.pickup_lat, featured.pickup_lng);
    const dropOk = isValidMapCoord(featured.delivery_lat, featured.delivery_lng);
    if (!pickupOk || !dropOk) return;

    const enrouteToPickup = active && ["driver_assigned", "driver_enroute_pickup"].includes(featured.status);
    const enrouteToBuyer = active && ["picked_up", "enroute_delivery"].includes(featured.status);
    const previewTrip = !active || featured.status === "requested";

    let origin: { lat: number; lng: number };
    let to: { lat: number; lng: number };

    if (previewTrip) {
      origin = { lat: featured.pickup_lat, lng: featured.pickup_lng };
      to = { lat: featured.delivery_lat, lng: featured.delivery_lng };
    } else if (enrouteToBuyer) {
      origin = livePos && isValidMapCoord(livePos.lat, livePos.lng)
        ? livePos
        : { lat: driverCenter[0], lng: driverCenter[1] };
      to = { lat: featured.delivery_lat, lng: featured.delivery_lng };
    } else {
      origin = livePos && isValidMapCoord(livePos.lat, livePos.lng)
        ? livePos
        : { lat: driverCenter[0], lng: driverCenter[1] };
      to = enrouteToPickup
        ? { lat: featured.pickup_lat, lng: featured.pickup_lng }
        : { lat: featured.delivery_lat, lng: featured.delivery_lng };
    }

    if (!isValidMapCoord(origin.lat, origin.lng) || !isValidMapCoord(to.lat, to.lng)) return;

    const prev = lastRouteOriginRef.current;
    const statusChanged = !prev || prev.status !== featured.status;
    const driftM = prev
      ? Math.hypot((origin.lat - prev.lat) * 111_000, (origin.lng - prev.lng) * 111_000 * Math.cos((origin.lat * Math.PI) / 180))
      : Infinity;
    // Re-route on status change or >150m drift — not every GPS tick
    if (!statusChanged && driftM < 150 && routeCoords.length > 1) return;

    lastRouteOriginRef.current = { lat: origin.lat, lng: origin.lng, status: featured.status };

    let cancelled = false;
    fetchDrivingRoute(origin, to).then((r) => {
      if (cancelled || !r) return;
      setRouteCoords(r.coordinates);
      setRouteMeta({
        distance_km: r.distance_km,
        duration_min: r.duration_min,
        duration_in_traffic_min: r.duration_in_traffic_min,
        source: r.source,
        steps: r.steps ?? [],
      });
    });
    return () => {
      cancelled = true;
    };
  }, [
    featured?.id,
    featured?.status,
    featured?.pickup_lat,
    featured?.pickup_lng,
    featured?.delivery_lat,
    featured?.delivery_lng,
    isIndex,
    active,
    livePos?.lat,
    livePos?.lng,
    driverCenter,
    routeCoords.length,
  ]);

  if (!isIndex) return <Outlet />;

  const toggleOnline = async () => {
    if (!user?.id) return;
    try {
      if (online) {
        await updateDriverAvailability(user.id, false);
        trackEvent("driver_online_toggle", { online: false });
        toast.success("You are offline");
        setOfferJob(null);
      } else {
        const ok = await goOnlineWithLocation(user.id);
        if (!ok) {
          toast.error("Turn on location to go online", {
            description: "We need your GPS to match you with nearby delivery jobs.",
          });
          return;
        }
        trackEvent("driver_online_toggle", { online: true });
        toast.success("You're live — watching for jobs nearby");
      }
      refetch();
    } catch {
      toast.error("Could not update status");
    }
  };

  const acceptJob = async (id: string) => {
    if (!driverProfile?.id) return;
    setAccepting(true);
    try {
      await acceptDelivery(id, driverProfile.id);
      trackEvent("driver_job_accept", { delivery_id: id, source: "popup" });
      toast.success("Job accepted — navigation started");
      setOfferJob(null);
      loadJobs();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not accept job");
    } finally {
      setAccepting(false);
    }
  };

  const declineJob = async (id: string) => {
    if (!driverProfile?.id) return;
    try {
      await declineDelivery(id, driverProfile.id);
      toast.message("Job declined");
      setOfferJob(null);
      loadJobs();
    } catch {
      toast.error("Could not decline");
    }
  };

  const messageBuyer = (job: DeliveryRow) => {
    const buyerId = job.order?.buyer_id;
    if (!buyerId) {
      toast.error("Buyer not available yet");
      return;
    }
    navigate({
      to: "/app/inbox/chat/$userId",
      params: { userId: buyerId },
      search: { order: job.order_id, delivery: job.id },
    });
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
      toast.success("Delivery completed — POD saved!");
      setPodJob(null);
      loadJobs();
    } catch {
      toast.error("Could not complete delivery");
      throw new Error("complete failed");
    }
  };

  const mapPins = useMemo(() => {
    const pins: { lat: number; lng: number; label: string; kind: "farm" | "buyer" | "driver" | "hub" }[] = [];
    // When online with no active trip: show all available job pickups on the map
    if (online && !active) {
      for (const j of availableJobs.slice(0, 12)) {
        if (isValidMapCoord(j.pickup_lat, j.pickup_lng)) {
          pins.push({
            lat: j.pickup_lat,
            lng: j.pickup_lng,
            label: j.pickup_address ?? "Job",
            kind: "farm",
          });
        }
        if (isValidMapCoord(j.delivery_lat, j.delivery_lng)) {
          pins.push({
            lat: j.delivery_lat,
            lng: j.delivery_lng,
            label: j.delivery_address ?? "Dropoff",
            kind: "buyer",
          });
        }
      }
    } else {
      if (featured && isValidMapCoord(featured.pickup_lat, featured.pickup_lng)) {
        pins.push({ lat: featured.pickup_lat, lng: featured.pickup_lng, label: "Pickup", kind: "farm" });
      }
      if (featured && isValidMapCoord(featured.delivery_lat, featured.delivery_lng)) {
        pins.push({ lat: featured.delivery_lat, lng: featured.delivery_lng, label: "Dropoff", kind: "buyer" });
      }
    }
    return pins;
  }, [featured, online, active, availableJobs]);

  const navDestination = active
    ? ["picked_up", "enroute_delivery"].includes(active.status)
      ? { lat: active.delivery_lat, lng: active.delivery_lng, label: active.delivery_address ?? "Buyer" }
      : { lat: active.pickup_lat, lng: active.pickup_lng, label: active.pickup_address ?? "Pickup" }
    : null;

  const slideLabel =
    featured?.status === "driver_enroute_pickup"
      ? "Slide to confirm pickup"
      : featured?.status === "enroute_delivery"
        ? "Slide to confirm delivery"
        : null;

  const etaMin = routeMeta?.duration_in_traffic_min ?? routeMeta?.duration_min;
  const payoutLabel = featured ? estimateDriverPayout(featured) : null;

  return (
    <VerifiedTransportGate>
      <AppShell role="transport">
        <div className="relative h-full w-full">
          <div className="absolute inset-0 z-0">
          <CorridorMap
            pins={mapPins}
            route={routeCoords}
            routeSegments={routeSegments}
            fitKey={routeFitKey}
            center={driverCenter}
            zoom={online ? STREET_ZOOM : DEFAULT_MAP_ZOOM}
            corridorOnly
            driverPosition={livePos ?? (driverProfile?.current_lat != null && driverProfile.current_lng != null ? { lat: driverProfile.current_lat, lng: driverProfile.current_lng } : null)}
            animateDriver={false}
            driverLabel="You"
            dark={false}
            height="100%"
            etaLabel={etaMin != null && !active ? `${Math.max(1, Math.round(etaMin))} min` : undefined}
            priceLabel={payoutLabel != null && !active ? `GHS ${Math.round(payoutLabel)}` : undefined}
          />
          </div>

          <div className="pointer-events-none absolute inset-0 z-10">
          {navDestination && (
            <DriverNavHud
              destinationLabel={navDestination.label}
              destination={{ lat: navDestination.lat, lng: navDestination.lng }}
              distanceKm={routeMeta?.distance_km}
              durationMin={routeMeta?.duration_min}
              durationInTrafficMin={routeMeta?.duration_in_traffic_min}
              routeSource={routeMeta?.source}
              steps={routeMeta?.steps}
              currentPosition={livePos}
              enabled={!!active}
              muted={navMuted}
              onToggleMute={() => setNavMuted((m) => !m)}
              placement="above-sheet"
            />
          )}

          <div className="pointer-events-none absolute left-3 top-[max(env(safe-area-inset-top),10px)] z-20 flex flex-col gap-2">
            <Link
              to="/app/buyer/feed"
              className="pointer-events-auto inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background/95 px-3 py-2 text-sm font-semibold text-foreground shadow-lg backdrop-blur-md"
            >
              <Sprout className="h-4 w-4 text-primary" />
              Shop
            </Link>
            {earnings && !active && (
              <div className="pointer-events-auto grid w-[10.5rem] grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-black/65 p-2 text-white backdrop-blur-md">
                <div className="text-center">
                  <div className="text-[9px] uppercase text-white/55">Today</div>
                  <div className="text-sm font-bold">{earnings.today.toFixed(0)}</div>
                </div>
                <div className="text-center border-x border-white/10">
                  <div className="text-[9px] uppercase text-white/55">Week</div>
                  <div className="text-sm font-bold">{earnings.week.toFixed(0)}</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] uppercase text-white/55">Trips</div>
                  <div className="text-sm font-bold">{earnings.trips}</div>
                </div>
              </div>
            )}
            <span className="pointer-events-auto inline-flex w-fit items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[10px] text-white backdrop-blur">
              <Truck className="h-3 w-3" /> {vehicleLabel} jobs only
            </span>
          </div>

          <button
            type="button"
            onClick={toggleOnline}
            className={`pointer-events-auto absolute right-3 z-40 inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold shadow-xl transition active:scale-[0.98] ${
              active ? "top-[max(env(safe-area-inset-top),10px)] px-3 py-2 text-xs" : "top-[max(env(safe-area-inset-top),3.5rem)]"
            } ${online ? "bg-emerald-500 text-white ring-2 ring-emerald-300" : "bg-foreground text-background"}`}
          >
            <Radio className={`h-4 w-4 ${online ? "animate-pulse" : ""}`} />
            {online ? "You're live" : "Go live"}
          </button>

          <div className="pointer-events-none absolute inset-x-0 bottom-[calc(var(--agrolink-tab-bar,3.5rem)+env(safe-area-inset-bottom))] z-20">
            {loading ? (
              <div className="pointer-events-auto mx-auto flex max-w-lg justify-center rounded-t-3xl bg-background/95 p-6 shadow-2xl">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : featured ? (
              <TransportTripSheet
                job={featured}
                active={!!active}
                online={online}
                etaMin={etaMin}
                distanceKm={routeMeta?.distance_km}
                vehicleLabel={vehicleLabel}
                slideLabel={slideLabel}
                jobsError={jobsError}
                onAdvance={() => advance(featured)}
                onMessage={() => messageBuyer(featured)}
                onCall={() => {
                  const phone = pickBuyerPhone(featured.order?.buyer);
                  if (dialPhone(phone, "Buyer")) return;
                  toast.error("Buyer phone not in profile — use chat or ask them to add it in Settings");
                }}
              />
            ) : (
              <div
                className={`pointer-events-auto mx-auto max-w-lg rounded-t-3xl border p-5 shadow-2xl backdrop-blur-md ${
                  online
                    ? "border-border/70 bg-background/95"
                    : "border-white/10 bg-zinc-950/80 text-white"
                }`}
              >
                {jobsError && (
                  <div className="mb-3 rounded-xl border border-amber-300/50 bg-amber-50/90 px-3 py-2 text-xs text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/50 dark:text-amber-100">
                    {jobsError}
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${
                      online
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-white/10 text-white/70"
                    }`}
                  >
                    {online ? (
                      <Radio className="h-4 w-4 animate-pulse" />
                    ) : (
                      <Truck className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1 text-left">
                    <p className={`font-sans text-sm font-semibold ${online ? "" : "text-white"}`}>
                      {online ? "Listening for jobs" : "Offline — map still open"}
                    </p>
                    <p className={`mt-1 text-xs leading-relaxed ${online ? "text-muted-foreground" : "text-white/65"}`}>
                      {online
                        ? `Matching ${vehicleLabel} runs near you. Stay on this screen for the next offer.`
                        : "You won’t get new job pings until you go live. Preview the corridor map anytime."}
                    </p>
                  </div>
                </div>
                {!online && (
                  <button
                    type="button"
                    onClick={toggleOnline}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition active:scale-[0.99]"
                  >
                    <Radio className="h-4 w-4" /> Go live
                  </button>
                )}
              </div>
            )}
          </div>
          </div>
        </div>
      </AppShell>

      {offerJob && !active && (
        <JobOfferSheet
          job={offerJob}
          accepting={accepting}
          onAccept={() => acceptJob(offerJob.id)}
          onDecline={() => declineJob(offerJob.id)}
          onClose={() => setOfferJob(null)}
          onExpired={loadJobs}
        />
      )}

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
