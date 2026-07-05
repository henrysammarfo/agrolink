import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Trash2, Plus, Minus, ArrowRight, ShieldCheck, Wallet, Loader2, Info, Smartphone } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import { useCart, useUpdateCartItem, useRemoveCartItem } from "@/hooks/use-marketplace";
import { HIGH_VALUE_OTP_THRESHOLD_GHS } from "@/lib/delivery-constants";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export const Route = createFileRoute("/app/buyer/cart")({
  head: () => ({ meta: [{ title: "Cart · AgroLink" }] }),
  component: Cart,
});

const DEMO_MODE =
  import.meta.env.VITE_DEMO_MODE === "true" || !import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

function Cart() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { data: items = [], isLoading } = useCart(user?.id);
  const updateItem = useUpdateCartItem(user?.id);
  const removeItem = useRemoveCartItem(user?.id);
  const [channel, setChannel] = useState<"mtn" | "vod" | "atl">("mtn");
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);
  const [displayText, setDisplayText] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [demoOtpHint, setDemoOtpHint] = useState<string | null>(null);

  const [deliveryQuote, setDeliveryQuote] = useState<{
    total: number;
    breakdown: string[];
    distanceKm: number;
    orderedStops?: { lat: number; lng: number; label?: string }[];
  } | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const subtotal = items.reduce(
    (s, i) => s + Number(i.listing?.price_per_unit ?? 0) * Number(i.quantity),
    0,
  );
  const delivery = deliveryQuote?.total ?? 0;
  const platformFee = Math.round(subtotal * 0.06 * 100) / 100;
  const total = subtotal + delivery + platformFee;
  const needsOtp = total >= HIGH_VALUE_OTP_THRESHOLD_GHS;

  const pickupStops = useMemo(() => {
    const stops = items
      .map((i) => i.listing)
      .filter((l): l is NonNullable<typeof l> => !!l?.lat && !!l?.lng)
      .map((l) => ({ lat: l.lat, lng: l.lng, label: l.location_name }));
    return [...new Map(stops.map((s) => [`${s.lat},${s.lng}`, s])).values()];
  }, [items]);

  useEffect(() => {
    if (!items.length) {
      setDeliveryQuote(null);
      return;
    }
    const first = items[0].listing;
    if (!first?.lat || !first?.lng) return;
    const weightKg = items.reduce((s, i) => s + Number(i.quantity), 0);
    setQuoteLoading(true);
    fetch("/api/delivery/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pickupLat: first.lat,
        pickupLng: first.lng,
        deliveryLat: first.lat + 0.05,
        deliveryLng: first.lng + 0.05,
        weightKg,
        vehicleType: weightKg > 80 ? "truck" : weightKg > 40 ? "pickup" : "motorcycle",
        pickupStops: pickupStops.length > 1 ? pickupStops : undefined,
      }),
    })
      .then((r) => r.json())
      .then((q) => setDeliveryQuote(q))
      .catch(() => setDeliveryQuote(null))
      .finally(() => setQuoteLoading(false));
  }, [items, pickupStops]);

  async function sendOtp() {
    if (!user?.id) return;
    setOtpLoading(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          phone: profile?.phone ?? "+233551234987",
          orderTotalGhs: total,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; demoCode?: string };
      if (!res.ok || !data.ok) throw new Error(data.message ?? "Could not send code");
      setOtpSent(true);
      if (data.demoCode) setDemoOtpHint(data.demoCode);
      toast.success(data.message ?? "Code sent");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "SMS failed");
    } finally {
      setOtpLoading(false);
    }
  }

  async function verifyOtp() {
    if (!user?.id || otpCode.length < 6) return;
    setOtpLoading(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, code: otpCode }),
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

  async function pay() {
    if (!user?.id || !user.email) {
      toast.error("Sign in to checkout");
      return;
    }
    if (needsOtp && !otpVerified) {
      toast.error(`Verify your phone for orders over GHS ${HIGH_VALUE_OTP_THRESHOLD_GHS}`);
      return;
    }
    setPaying(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          phone: profile?.phone ?? "+233551234987",
          momoProvider: channel,
          deliveryAddress: profile?.region ?? "Greater Accra",
          otpVerified: needsOtp ? otpVerified : undefined,
        }),
      });
      const data = (await res.json()) as { orderId?: string; displayText?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      setDisplayText(data.displayText ?? "Approve payment on your phone.");
      setDone(true);
      toast.success("Payment initiated", {
        description: data.displayText ?? "Check your phone to approve MoMo.",
      });
    } catch (error) {
      toast.error("Payment failed", {
        description: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setPaying(false);
    }
  }

  if (isLoading) {
    return (
      <AppShell role="buyer">
        <div className="grid place-items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="buyer">
      <PageHeader eyebrow="Checkout" title="Your" italic="cart" />

      {DEMO_MODE && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs">
          <Wallet className="h-4 w-4 text-amber-600 mt-0.5" />
          <p className="text-foreground/80">
            <span className="font-medium text-foreground">Test mode.</span> Paystack test MoMo — use
            0551234987 on MTN. No real money unless live keys are set.
          </p>
        </div>
      )}

      {done && displayText && (
        <div className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm">
          <ShieldCheck className="inline h-4 w-4 text-primary mr-2" />
          {displayText}
          <button
            onClick={() => navigate({ to: "/app/buyer/orders" })}
            className="mt-3 block text-primary underline-offset-4 hover:underline"
          >
            Track your order →
          </button>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          {items.map((it) => (
            <div
              key={it.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                {it.listing?.image_url && (
                  <img
                    src={it.listing.image_url}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-serif text-xl">{it.listing?.title ?? "Produce"}</div>
                <div className="text-xs text-muted-foreground">{it.listing?.location_name}</div>
                <div className="mt-2 text-sm text-primary">
                  GHS {it.listing?.price_per_unit}/{it.listing?.unit ?? "kg"}
                </div>
              </div>
              <div className="flex items-center gap-1 rounded-full border border-border p-1">
                <button
                  onClick={() =>
                    updateItem.mutate({ itemId: it.id, quantity: Math.max(1, it.quantity - 1) })
                  }
                  className="grid h-7 w-7 place-items-center rounded-full hover:bg-background"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center text-sm">{it.quantity}</span>
                <button
                  onClick={() => updateItem.mutate({ itemId: it.id, quantity: it.quantity + 1 })}
                  className="grid h-7 w-7 place-items-center rounded-full hover:bg-background"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                onClick={() => removeItem.mutate(it.id)}
                className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
              Cart is empty.{" "}
              <a className="text-primary underline-offset-4 hover:underline" href="/app/buyer/feed">
                Browse the feed →
              </a>
            </div>
          )}
        </div>

        <aside className="rounded-3xl border border-border bg-card p-6">
          <h2 className="font-serif text-2xl">Summary</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>GHS {subtotal.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground inline-flex items-center gap-1">
                Delivery {quoteLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              </dt>
              <dd>{deliveryQuote ? `GHS ${delivery.toFixed(2)}` : "—"}</dd>
            </div>
            {deliveryQuote?.breakdown && (
              <div className="rounded-xl border border-border bg-background p-3 text-[11px] text-muted-foreground space-y-1">
                <div className="inline-flex items-center gap-1 font-medium text-foreground"><Info className="h-3 w-3" /> Pricing factors</div>
                {deliveryQuote.breakdown.map((line) => (
                  <div key={line}>{line}</div>
                ))}
                <div>{deliveryQuote.distanceKm.toFixed(1)} km via OSRM routing</div>
                {deliveryQuote.orderedStops && deliveryQuote.orderedStops.length > 1 && (
                  <div className="text-primary font-medium">
                    {deliveryQuote.orderedStops.length} farm pickups · co-op batch route
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Platform fee (6%)</dt>
              <dd>GHS {platformFee.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 font-medium">
              <dt>Total</dt>
              <dd className="font-serif text-xl">GHS {total.toFixed(2)}</dd>
            </div>
          </dl>

          {needsOtp && (
            <div className="mt-6 rounded-2xl border border-primary/25 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Smartphone className="h-4 w-4 text-primary" />
                B2B verification (GHS {HIGH_VALUE_OTP_THRESHOLD_GHS}+)
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Hubtel SMS OTP required before checkout.
              </p>
              {!otpVerified ? (
                <div className="mt-4 space-y-3">
                  {!otpSent ? (
                    <button
                      onClick={sendOtp}
                      disabled={otpLoading}
                      className="w-full rounded-full border border-primary py-2.5 text-sm text-primary hover:bg-primary/10 disabled:opacity-50"
                    >
                      {otpLoading ? "Sending…" : "Send verification code"}
                    </button>
                  ) : (
                    <>
                      {demoOtpHint && (
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          Demo code: <span className="font-mono font-bold">{demoOtpHint}</span>
                        </p>
                      )}
                      <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                        <InputOTPGroup>
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <InputOTPSlot key={i} index={i} />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                      <button
                        onClick={verifyOtp}
                        disabled={otpLoading || otpCode.length < 6}
                        className="w-full rounded-full bg-primary py-2.5 text-sm text-primary-foreground disabled:opacity-50"
                      >
                        {otpLoading ? "Checking…" : "Verify code"}
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Phone verified
                </p>
              )}
            </div>
          )}

          <div className="mt-6">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              MoMo network
            </label>
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
            onClick={pay}
            disabled={paying || items.length === 0 || done || quoteLoading || !deliveryQuote || (needsOtp && !otpVerified)}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50"
          >
            {paying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            {paying ? "Processing…" : `Pay GHS ${total.toFixed(2)} via MoMo`}
          </button>
        </aside>
      </div>
    </AppShell>
  );
}
