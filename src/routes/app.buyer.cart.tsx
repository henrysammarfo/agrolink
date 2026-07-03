import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Trash2, Plus, Minus, ArrowRight, ShieldCheck, Wallet } from "lucide-react";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { listings } from "@/lib/mock-data";

export const Route = createFileRoute("/app/buyer/cart")({
  head: () => ({ meta: [{ title: "Cart · AgroLink" }] }),
  component: Cart,
});

const DEMO_MODE = true;

function Cart() {
  const [items, setItems] = useState(listings.slice(0, 3).map((l) => ({ ...l, qty: 5 })));
  const [channel, setChannel] = useState("MTN MoMo");
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);

  const subtotal = items.reduce((s, i) => s + i.pricePerKg * i.qty, 0);
  const delivery = 70;
  const platformFee = Math.round(subtotal * 0.06);
  const total = subtotal + delivery + platformFee;

  function pay() {
    setPaying(true);
    setTimeout(() => { setPaying(false); setDone(true); }, 1500);
  }

  return (
    <AppShell role="buyer">
      <PageHeader eyebrow="Checkout" title="Your" italic="cart" />

      {DEMO_MODE && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs">
          <Wallet className="h-4 w-4 text-amber-600 mt-0.5" />
          <p className="text-foreground/80">
            <span className="font-medium text-foreground">Demo mode.</span> Payments run on Paystack test keys —
            no real money moves. Flip a single env flag to go live for production.
          </p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                <img src={it.image} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-serif text-xl">{it.produce}</div>
                <div className="text-xs text-muted-foreground">{it.farmer} · {it.location}</div>
                <div className="mt-2 text-sm text-primary">GHS {it.pricePerKg}/kg</div>
              </div>
              <div className="flex items-center gap-1 rounded-full border border-border p-1">
                <button onClick={() => setItems((a) => a.map((x) => x.id === it.id ? { ...x, qty: Math.max(1, x.qty - 1) } : x))} className="grid h-7 w-7 place-items-center rounded-full hover:bg-background">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center text-sm">{it.qty}</span>
                <button onClick={() => setItems((a) => a.map((x) => x.id === it.id ? { ...x, qty: x.qty + 1 } : x))} className="grid h-7 w-7 place-items-center rounded-full hover:bg-background">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <button onClick={() => setItems((a) => a.filter((x) => x.id !== it.id))} className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
              Cart is empty. <a className="text-primary underline-offset-4 hover:underline" href="/app/buyer/feed">Browse the feed →</a>
            </div>
          )}
        </div>

        <aside className="rounded-3xl border border-border bg-card p-6">
          <h2 className="font-serif text-2xl">Summary</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <Row label="Subtotal" value={`GHS ${subtotal}`} />
            <Row label="Delivery (16–40 km)" value={`GHS ${delivery}`} />
            <Row label="Platform fee (6%)" value={`GHS ${platformFee}`} />
            <div className="border-t border-border pt-3">
              <Row label="Total" value={`GHS ${total}`} bold />
            </div>
          </dl>

          <div className="mt-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Pay with</div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              {["MTN MoMo", "Vodafone", "AirtelTigo"].map((p) => (
                <button key={p} onClick={() => setChannel(p)} className={`rounded-xl border py-3 transition ${channel === p ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {!done ? (
            <button
              onClick={pay}
              disabled={paying || items.length === 0}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-60"
            >
              {paying ? "Sending USSD prompt…" : <>Pay GHS {total} <ArrowRight className="h-4 w-4" /></>}
            </button>
          ) : (
            <div className="mt-8 rounded-2xl border border-primary/40 bg-primary/10 p-5 text-center">
              <ShieldCheck className="mx-auto h-6 w-6 text-primary" />
              <p className="mt-2 font-serif text-xl">Demo payment confirmed</p>
              <p className="mt-1 text-xs text-muted-foreground">Your order is being prepared.</p>
            </div>
          )}
          <p className="mt-4 inline-flex w-full items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Secured by Paystack {DEMO_MODE && "· test"}
          </p>
        </aside>
      </div>
    </AppShell>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={bold ? "font-medium" : "text-muted-foreground"}>{label}</dt>
      <dd className={bold ? "font-serif text-2xl text-primary" : "text-foreground"}>{value}</dd>
    </div>
  );
}
