import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Trash2, Plus, Minus, ArrowRight, ShieldCheck, Wallet, Loader2, Smartphone, ChevronLeft, Flag, User, ChevronRight } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { CartSkeleton } from "@/components/feed/FeedSkeleton";
import { useAuth } from "@/lib/auth";
import { useCart, useUpdateCartItem, useRemoveCartItem } from "@/hooks/use-marketplace";
import { HIGH_VALUE_OTP_THRESHOLD_GHS } from "@/lib/delivery-constants";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { getCurrentPosition } from "@/lib/native-geolocation";
import { trackEvent } from "@/lib/analytics";
import { apiFetch } from "@/lib/api/fetch-auth";
import { LocationSearchSheet } from "@/components/checkout/LocationSearchSheet";
import { CorridorMap } from "@/components/map/CorridorMap";
import { fetchDrivingRoute } from "@/lib/api/driver";
import { buildTrafficSegments } from "@/lib/route-display";
import { GHANA_LOCATIONS } from "@/lib/ghana-locations";
import { reverseGeocode } from "@/lib/api/maps";
import { FULFILLMENT_OPTIONS, type FulfillmentMode } from "@/lib/fulfillment";
import type { MapLocation } from "@/lib/api/maps";
import { DeliveryVehiclePicker, mapQuoteVehicle } from "@/components/checkout/DeliveryVehiclePicker";
import { ACCRA_CENTER, isInGreaterAccra, isValidMapCoord, STREET_ZOOM } from "@/lib/map-coords";
import { LifecycleStepper } from "@/components/order/LifecycleStepper";
import {
  CHECKOUT_MAIN_STEPS,
  DELIVERY_SETUP_SUBSTEPS,
  getDeliverySetupSubstep,
} from "@/lib/order-lifecycle";

const DEFAULT_DELIVERY: MapLocation = GHANA_LOCATIONS[0];

export const Route = createFileRoute("/app/buyer/cart")({
  head: () => ({ meta: [{ title: "Cart · AgroLink" }] }),
  component: Cart,
});

const DEMO_MODE =
  import.meta.env.VITE_DEMO_MODE === "true" || !import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

function Cart() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const { data: items = [], isLoading } = useCart(user?.id);
  const updateItem = useUpdateCartItem(user?.id);
  const removeItem = useRemoveCartItem(user?.id);
  const [channel, setChannel] = useState<"mtn" | "vod" | "atl">("mtn");
  const [paying, setPaying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [demoOtpHint, setDemoOtpHint] = useState<string | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<MapLocation>(DEFAULT_DELIVERY);
  const [fulfillmentMode, setFulfillmentMode] = useState<FulfillmentMode>("platform_delivery");
  const [selectedVehicle, setSelectedVehicle] = useState<"bicycle" | "motorcycle" | "car">("motorcycle");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [deliveryQuote, setDeliveryQuote] = useState<{
    total: number;
    breakdown: string[];
    distanceKm: number;
    routingSource?: "google" | "osrm" | "haversine";
    orderedStops?: { lat: number; lng: number; label?: string }[];
  } | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [addressSheetOpen, setAddressSheetOpen] = useState(false);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeEtaMin, setRouteEtaMin] = useState<number | null>(null);
  const [driversNearby, setDriversNearby] = useState(0);

  const subtotal = items.reduce(
    (s, i) => s + Number(i.listing?.price_per_unit ?? 0) * Number(i.quantity),
    0,
  );
  const needsDelivery = fulfillmentMode === "platform_delivery";
  const delivery = needsDelivery ? (deliveryQuote?.total ?? 0) : 0;
  const platformFee = Math.round(subtotal * 0.06 * 100) / 100;
  const total = subtotal + delivery + platformFee;
  const needsOtp = total >= HIGH_VALUE_OTP_THRESHOLD_GHS;
  const canPay =
    items.length > 0 &&
    !quoteLoading &&
    (needsDelivery ? !!deliveryQuote : true) &&
    (!needsOtp || otpVerified);
  const canContinueStep2 =
    items.length > 0 && (needsDelivery ? !!deliveryQuote && !quoteLoading : true);

  const pickupStops = useMemo(() => {
    const stops = items
      .map((i) => i.listing)
      .filter((l): l is NonNullable<typeof l> => !!l?.lat && !!l?.lng && isValidMapCoord(l.lat, l.lng))
      .map((l) => ({ lat: l.lat, lng: l.lng, label: l.location_name }));
    return [...new Map(stops.map((s) => [`${s.lat},${s.lng}`, s])).values()];
  }, [items]);

  const mapCenter = useMemo((): [number, number] => {
    const points = [
      ...pickupStops,
      isValidMapCoord(deliveryLocation.lat, deliveryLocation.lng) ? deliveryLocation : null,
    ].filter(Boolean) as { lat: number; lng: number }[];
    if (!points.length) return ACCRA_CENTER;
    const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
    const lng = points.reduce((s, p) => s + p.lng, 0) / points.length;
    return [lat, lng];
  }, [pickupStops, deliveryLocation]);

  const mapFitKey = `${deliveryLocation.lat},${deliveryLocation.lng}:${routeCoords.length}:${driversNearby}`;

  const mapPins = useMemo(() => {
    const pins: { lat: number; lng: number; label: string; kind: "farm" | "buyer" | "driver" }[] = [];
    for (const s of pickupStops) {
      pins.push({ lat: s.lat, lng: s.lng, label: s.label ?? "Farm", kind: "farm" });
    }
    if (isValidMapCoord(deliveryLocation.lat, deliveryLocation.lng)) {
      pins.push({ lat: deliveryLocation.lat, lng: deliveryLocation.lng, label: "You", kind: "buyer" });
    }
    return pins;
  }, [pickupStops, deliveryLocation]);

  const routeSegments = useMemo(() => buildTrafficSegments(routeCoords), [routeCoords]);

  const pickupLabel = pickupStops[0]?.label ?? items[0]?.listing?.location_name ?? "Farm pickup";

  useEffect(() => {
    if (step !== 2 || !needsDelivery || !pickupStops[0]) {
      setRouteCoords([]);
      setRouteEtaMin(null);
      return;
    }
    const dest = deliveryLocation;
    if (!isValidMapCoord(dest.lat, dest.lng)) return;
    let cancelled = false;
    fetchDrivingRoute(
      { lat: pickupStops[0].lat, lng: pickupStops[0].lng },
      { lat: dest.lat, lng: dest.lng },
    ).then((r) => {
      if (cancelled || !r) return;
      setRouteCoords(r.coordinates);
      setRouteEtaMin(Math.round(r.duration_in_traffic_min ?? r.duration_min));
    });
    return () => {
      cancelled = true;
    };
  }, [step, needsDelivery, deliveryLocation.lat, deliveryLocation.lng, pickupStops]);

  useEffect(() => {
    void getCurrentPosition().then(async (p) => {
      if (!p || !isValidMapCoord(p.lat, p.lng)) return;
      try {
        const loc = await reverseGeocode(p.lat, p.lng);
        if (isInGreaterAccra(loc.lat, loc.lng)) {
          setDeliveryLocation(loc);
        } else {
          setDeliveryLocation(DEFAULT_DELIVERY);
        }
      } catch {
        if (isInGreaterAccra(p.lat, p.lng)) {
          setDeliveryLocation({ name: "Your location", lat: p.lat, lng: p.lng });
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!items.length || !needsDelivery || step < 2) {
      if (!needsDelivery) setDeliveryQuote(null);
      return;
    }
    const first = pickupStops[0];
    if (!first || !isValidMapCoord(deliveryLocation.lat, deliveryLocation.lng)) return;
    const weightKg = items.reduce((s, i) => s + Number(i.quantity), 0);
    setQuoteLoading(true);
    apiFetch("/api/delivery/quote", {
      method: "POST",
      body: JSON.stringify({
        pickupLat: first.lat,
        pickupLng: first.lng,
        deliveryLat: deliveryLocation.lat,
        deliveryLng: deliveryLocation.lng,
        weightKg,
        vehicleType: mapQuoteVehicle(selectedVehicle),
        pickupStops: pickupStops.length > 1 ? pickupStops : undefined,
      }),
    })
      .then((r) => r.json())
      .then((q) => setDeliveryQuote(q))
      .catch(() => setDeliveryQuote(null))
      .finally(() => setQuoteLoading(false));
  }, [items, pickupStops, deliveryLocation, needsDelivery, selectedVehicle, step]);

  useEffect(() => {
    if (step !== 2 || !needsDelivery || !pickupStops[0]) {
      setDriversNearby(0);
      return;
    }
    const load = () => {
      const params = new URLSearchParams({
        pickupLat: String(pickupStops[0].lat),
        pickupLng: String(pickupStops[0].lng),
        deliveryLat: String(deliveryLocation.lat),
        deliveryLng: String(deliveryLocation.lng),
        weightKg: String(items.reduce((s, i) => s + Number(i.quantity), 0)),
      });
      apiFetch(`/api/delivery/availability?${params}`)
        .then((r) => r.json())
        .then((j: { driversNearby?: number }) => {
          setDriversNearby(j.driversNearby ?? 0);
        })
        .catch(() => {
          setDriversNearby(0);
        });
    };
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [step, needsDelivery, pickupStops, deliveryLocation.lat, deliveryLocation.lng, items]);

  async function sendOtp() {
    if (!user?.id) return;
    setOtpLoading(true);
    try {
      const res = await apiFetch("/api/otp/send", {
        method: "POST",
        body: JSON.stringify({
          phone: profile?.phone ?? "+233551234987",
          email: user.email,
          orderTotalGhs: total,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; demoCode?: string };
      if (!res.ok || !data.ok) throw new Error(data.message ?? "Could not send code");
      setOtpSent(true);
      if (data.demoCode) setDemoOtpHint(data.demoCode);
      toast.success(data.message ?? "Code sent");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send code");
    } finally {
      setOtpLoading(false);
    }
  }

  async function verifyOtp() {
    if (!user?.id || otpCode.length < 6) return;
    setOtpLoading(true);
    try {
      const res = await apiFetch("/api/otp/verify", {
        method: "POST",
        body: JSON.stringify({ code: otpCode }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!data.ok) throw new Error(data.message ?? "Invalid code");
      setOtpVerified(true);
      toast.success("Verified — you can pay now");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setOtpLoading(false);
    }
  }

  const checkoutStepId = step === 1 ? "cart" : step === 2 ? "delivery" : "payment";

  async function pay() {
    if (!user?.id || !user.email) {
      toast.error("Sign in to checkout");
      return;
    }
    if (!canPay) {
      toast.error("Complete delivery and verification first");
      return;
    }
    setPaying(true);
    try {
      const res = await apiFetch("/api/checkout", {
        method: "POST",
        body: JSON.stringify({
          email: user.email,
          phone: profile?.phone ?? "+233551234987",
          momoProvider: channel,
          deliveryAddress: needsDelivery ? deliveryLocation.name : undefined,
          deliveryLat: needsDelivery ? deliveryLocation.lat : undefined,
          deliveryLng: needsDelivery ? deliveryLocation.lng : undefined,
          fulfillmentMode,
          otpVerified: needsOtp ? otpVerified : undefined,
          vehicleType: needsDelivery ? selectedVehicle : undefined,
        }),
      });
      const data = (await res.json()) as {
        orderId?: string;
        authorizationUrl?: string;
        displayText?: string;
        demoMode?: boolean;
        paymentConfirmed?: boolean;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      trackEvent("checkout_initiated", { total, channel });
      if (user.id) {
        void queryClient.invalidateQueries({ queryKey: ["buyer-orders", user.id] });
        void queryClient.invalidateQueries({ queryKey: ["cart", user.id] });
      }
      if (data.authorizationUrl && !data.demoMode) {
        toast.success("Redirecting to Paystack…", {
          description: data.displayText ?? "Complete payment to confirm your order.",
        });
        window.location.assign(data.authorizationUrl);
        return;
      }
      toast.success(data.paymentConfirmed ? "Payment confirmed" : "Payment initiated", {
        description: data.displayText ?? "Your order is being processed.",
      });
      if (data.orderId) {
        const dest = needsDelivery
          ? "/app/buyer/orders/$orderId/match"
          : "/app/buyer/orders/$orderId/success";
        await navigate({ to: dest, params: { orderId: data.orderId }, replace: true });
        return;
      }
    } catch (error) {
      toast.error("Payment failed", {
        description: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setPaying(false);
    }
  }

  const deliverySubstep = getDeliverySetupSubstep({
    fulfillmentMode,
    hasAddress: isValidMapCoord(deliveryLocation.lat, deliveryLocation.lng),
    hasVehicle: !!selectedVehicle,
    hasQuote: !!deliveryQuote,
    driversNearby,
  });

  if (isLoading) {
    return (
      <AppShell role="buyer" compact>
        <PageHeader eyebrow="Checkout" title="Your" italic="cart" />
        <CartSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell role="buyer" compact hideMobileNav={step === 2 && needsDelivery}>
      {!(step === 2 && needsDelivery) && (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate({ to: "/app/buyer/feed" })}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" /> Back to feed
            </button>
          </div>
          <PageHeader eyebrow="Checkout" title="Your" italic="order" />
          <LifecycleStepper
            steps={CHECKOUT_MAIN_STEPS}
            currentStepId={checkoutStepId}
            className="mb-6"
          />
        </>
      )}

      {step === 1 && (
        <div className="space-y-4">
          {items.map((it) => (
            <CartLine
              key={it.id}
              it={it}
              onMinus={() => updateItem.mutate({ itemId: it.id, quantity: Math.max(1, it.quantity - 1) })}
              onPlus={() => updateItem.mutate({ itemId: it.id, quantity: it.quantity + 1 })}
              onRemove={() => removeItem.mutate(it.id)}
            />
          ))}
          {items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
              Cart is empty.{" "}
              <a className="text-primary underline-offset-4 hover:underline" href="/app/buyer/feed">
                Browse the feed →
              </a>
            </div>
          )}
          <OrderTotals subtotal={subtotal} delivery={delivery} platformFee={platformFee} total={total} needsDelivery={needsDelivery} />
          <button
            type="button"
            disabled={items.length === 0}
            onClick={() => setStep(2)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-medium text-background disabled:opacity-50"
          >
            Continue to delivery <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="relative -mx-4 sm:-mx-6 md:-mx-10">
          {needsDelivery && pickupStops[0] ? (
            <>
              <div className="relative h-[42vh] min-h-[280px] max-h-[420px]">
                <CorridorMap
                  pins={mapPins}
                  route={routeCoords}
                  routeSegments={routeSegments}
                  fitKey={mapFitKey}
                  center={mapCenter}
                  zoom={STREET_ZOOM}
                  corridorOnly
                  dark={false}
                  height="100%"
                  etaLabel={routeEtaMin != null ? `${routeEtaMin} min` : undefined}
                />
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="absolute left-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-background/95 shadow-md"
                  aria-label="Back"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              </div>

              <div className="relative z-10 -mt-6 rounded-t-3xl border border-border bg-background px-4 pb-[calc(env(safe-area-inset-bottom)+5rem)] pt-4 shadow-[0_-8px_30px_rgba(0,0,0,.08)]">
                <LifecycleStepper steps={CHECKOUT_MAIN_STEPS} currentStepId="delivery" compact className="mb-3" />
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Delivery setup</p>
                <div className="mt-2">
                  <LifecycleStepper steps={DELIVERY_SETUP_SUBSTEPS} currentStepId={deliverySubstep} compact />
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-4">Your trip</p>
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {FULFILLMENT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFulfillmentMode(opt.value)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                        fulfillmentMode === opt.value
                          ? "bg-primary text-primary-foreground"
                          : "border border-border text-muted-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setAddressSheetOpen(true)}
                  className="mt-3 w-full rounded-2xl border border-border bg-card p-3 text-left"
                >
                  <div className="flex items-center gap-3 border-b border-border pb-2">
                    <User className="h-4 w-4 text-rose-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase text-muted-foreground">Pickup</p>
                      <p className="truncate text-sm font-medium">{pickupLabel}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <Flag className="h-4 w-4 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-primary">
                        {deliveryLocation.name.split(",")[0]}
                        {routeEtaMin != null && ` · ${routeEtaMin} min`}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{deliveryLocation.name}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                </button>

                {pickupStops[0] && (
                  <div className="mt-4">
                    <DeliveryVehiclePicker
                      pickupLat={pickupStops[0].lat}
                      pickupLng={pickupStops[0].lng}
                      deliveryLat={deliveryLocation.lat}
                      deliveryLng={deliveryLocation.lng}
                      weightKg={items.reduce((s, i) => s + Number(i.quantity), 0)}
                      value={selectedVehicle}
                      onChange={setSelectedVehicle}
                      etaMin={routeEtaMin ?? undefined}
                    />
                    {driversNearby > 0 ? (
                      <p className="mt-2 text-xs text-emerald-600">
                        Couriers available in this area — exact locations stay private until you pay.
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">
                        No drivers online nearby — you can still checkout; we&apos;ll search when you pay.
                      </p>
                    )}
                  </div>
                )}

                {deliveryQuote?.breakdown?.length ? (
                  <p className="mt-2 text-[11px] text-muted-foreground line-clamp-2">
                    {deliveryQuote.breakdown.join(" · ")} · {deliveryQuote.distanceKm.toFixed(1)} km
                  </p>
                ) : null}
              </div>

              <LocationSearchSheet
                open={addressSheetOpen}
                onClose={() => setAddressSheetOpen(false)}
                pickupLabel={pickupLabel}
                value={deliveryLocation}
                onChange={(loc) => {
                  if (isValidMapCoord(loc.lat, loc.lng) && isInGreaterAccra(loc.lat, loc.lng)) {
                    setDeliveryLocation(loc);
                  } else {
                    toast.error("Choose an address in Greater Accra");
                  }
                }}
                recentPicks={GHANA_LOCATIONS}
              />

              <div className="fixed inset-x-0 bottom-[max(env(safe-area-inset-bottom),0.5rem)] z-20 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
                <div className="mx-auto flex max-w-lg items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-sans text-lg font-bold">GHS {total.toFixed(0)}</p>
                  </div>
                  <button
                    type="button"
                    disabled={!canContinueStep2}
                    onClick={() => setStep(3)}
                    className="inline-flex flex-[1.4] items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {quoteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-5 px-1">
              <button type="button" onClick={() => setStep(1)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-4 w-4" /> Back to cart
              </button>
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Fulfillment</p>
                {FULFILLMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFulfillmentMode(opt.value)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      fulfillmentMode === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{opt.description}</div>
                  </button>
                ))}
              </div>
              <div className="rounded-2xl border border-dashed border-border p-4 text-xs text-muted-foreground">
                {fulfillmentMode === "farm_pickup"
                  ? "You'll collect at the farmer's location after payment."
                  : "Your driver collects at the farm after payment."}
              </div>
              <OrderTotals subtotal={subtotal} delivery={delivery} platformFee={platformFee} total={total} needsDelivery={needsDelivery} />
              <button
                type="button"
                disabled={!canContinueStep2}
                onClick={() => setStep(3)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-medium text-background disabled:opacity-50"
              >
                Continue to payment <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="mx-auto max-w-md space-y-5">
          <button type="button" onClick={() => setStep(2)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> Back to delivery
          </button>
          {DEMO_MODE && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs">
              <Wallet className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p>Test mode — use 0551234987 on MTN.</p>
            </div>
          )}
          <OrderTotals subtotal={subtotal} delivery={delivery} platformFee={platformFee} total={total} needsDelivery={needsDelivery} />
          {needsOtp && (
            <OtpBlock
              verified={otpVerified}
              otpSent={otpSent}
              otpCode={otpCode}
              otpLoading={otpLoading}
              demoOtpHint={demoOtpHint}
              onSend={sendOtp}
              onVerify={verifyOtp}
              onCodeChange={setOtpCode}
            />
          )}
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">MoMo network</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as "mtn" | "vod" | "atl")}
              className="mt-2 block w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
            >
              <option value="mtn">MTN MoMo</option>
              <option value="vod">Telecel Cash</option>
              <option value="atl">AT Money</option>
            </select>
          </div>
          <button
            type="button"
            onClick={pay}
            disabled={paying || !canPay}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-medium text-background disabled:opacity-50"
          >
            {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {paying ? "Processing…" : DEMO_MODE ? `Pay GHS ${total.toFixed(2)} (demo)` : `Pay GHS ${total.toFixed(2)} via Paystack`}
          </button>
        </div>
      )}
    </AppShell>
  );
}

function OrderTotals({
  subtotal, delivery, platformFee, total, needsDelivery, quoteLoading,
}: {
  subtotal: number; delivery: number; platformFee: number; total: number; needsDelivery: boolean; quoteLoading?: boolean;
}) {
  return (
    <dl className="rounded-2xl border border-border bg-card p-4 space-y-2 text-sm">
      <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>GHS {subtotal.toFixed(2)}</dd></div>
      <div className="flex justify-between">
        <dt className="text-muted-foreground inline-flex items-center gap-1">
          Delivery {quoteLoading && <Loader2 className="h-3 w-3 animate-spin" />}
        </dt>
        <dd>{needsDelivery ? `GHS ${delivery.toFixed(2)}` : "GHS 0.00"}</dd>
      </div>
      <div className="flex justify-between"><dt className="text-muted-foreground">Platform fee</dt><dd>GHS {platformFee.toFixed(2)}</dd></div>
      <div className="flex justify-between border-t border-border pt-2 font-medium">
        <dt>Total</dt><dd className="font-serif text-lg">GHS {total.toFixed(2)}</dd>
      </div>
    </dl>
  );
}

function OtpBlock({
  verified, otpSent, otpCode, otpLoading, demoOtpHint, onSend, onVerify, onCodeChange,
}: {
  verified: boolean; otpSent: boolean; otpCode: string; otpLoading: boolean; demoOtpHint: string | null;
  onSend: () => void; onVerify: () => void; onCodeChange: (v: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Smartphone className="h-4 w-4 text-primary" />
        B2B verification (GHS {HIGH_VALUE_OTP_THRESHOLD_GHS}+)
      </div>
      {!verified ? (
        <div className="mt-4 space-y-3">
          {!otpSent ? (
            <button type="button" onClick={onSend} disabled={otpLoading} className="w-full rounded-full border border-primary py-2.5 text-sm text-primary disabled:opacity-50">
              {otpLoading ? "Sending…" : "Send verification code"}
            </button>
          ) : (
            <>
              {demoOtpHint && <p className="text-xs text-amber-700">Demo code: <span className="font-mono font-bold">{demoOtpHint}</span></p>}
              <InputOTP maxLength={6} value={otpCode} onChange={onCodeChange}>
                <InputOTPGroup>{[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup>
              </InputOTP>
              <button type="button" onClick={onVerify} disabled={otpLoading || otpCode.length < 6} className="w-full rounded-full bg-primary py-2.5 text-sm text-primary-foreground disabled:opacity-50">
                {otpLoading ? "Checking…" : "Verify code"}
              </button>
            </>
          )}
        </div>
      ) : (
        <p className="mt-2 text-xs text-emerald-600 flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Phone verified</p>
      )}
    </div>
  );
}

function CartLine({
  it, onMinus, onPlus, onRemove,
}: {
  it: { id: string; quantity: number; listing?: { title?: string; location_name?: string; price_per_unit?: number; unit?: string; image_url?: string | null } | null };
  onMinus: () => void; onPlus: () => void; onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-border bg-card p-3 sm:p-4">
      <div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
        {it.listing?.image_url && <img src={it.listing.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-serif text-lg sm:text-xl line-clamp-1">{it.listing?.title ?? "Produce"}</div>
        <div className="text-xs text-muted-foreground">{it.listing?.location_name}</div>
        <div className="mt-1 text-sm text-primary">GHS {it.listing?.price_per_unit}/{it.listing?.unit ?? "kg"}</div>
      </div>
      <div className="flex items-center gap-1 rounded-full border border-border p-1">
        <button type="button" onClick={onMinus} className="grid h-7 w-7 place-items-center rounded-full hover:bg-background"><Minus className="h-3.5 w-3.5" /></button>
        <span className="w-6 text-center text-sm">{it.quantity}</span>
        <button type="button" onClick={onPlus} className="grid h-7 w-7 place-items-center rounded-full hover:bg-background"><Plus className="h-3.5 w-3.5" /></button>
      </div>
      <button type="button" onClick={onRemove} className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:text-destructive">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
