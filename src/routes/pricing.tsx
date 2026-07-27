import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ArrowRight, Truck, BadgePercent, Wallet, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing · AgroLink" },
      { name: "description", content: "Free for everyone. A thin service fee on completed orders. See the math vs. middlemen." },
      { property: "og:title", content: "Pricing · AgroLink" },
      { property: "og:description", content: "Free for everyone. A thin fee on completed orders." },
    ],
  }),
  component: Pricing,
});

const TRANSPORT = [
  { range: "0 – 15 km", price: "GHS 35" },
  { range: "16 – 40 km", price: "GHS 70" },
  { range: "41 – 80 km", price: "GHS 140" },
  { range: "80 km+", price: "GHS 1.8 / km" },
];

const ROLES = [
  { icon: Sparkles, t: "Farmers", price: "Free", sub: "Keep 94% of every sale.", features: ["Unlimited listings", "AI pricing suggestions", "Same-evening MoMo payout"] },
  { icon: BadgePercent, t: "Buyers", price: "Free", sub: "Pay only produce + delivery.", features: ["Swipe the feed", "Mobile-money checkout", "Live order tracking"] },
  { icon: Truck, t: "Transport partners", price: "Free", sub: "Keep 88% of every job.", features: ["Live job board", "Auto-routed multi-pickups", "Daily MoMo payouts"] },
];

function Pricing() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-6 py-10 md:px-12">
        <header className="max-w-3xl">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Pricing</span>
          <h1 className="mt-3 font-serif text-5xl md:text-7xl text-foreground">
            Free for everyone. <span className="italic">A thin fee on what sells.</span>
          </h1>
          <p className="mt-6 text-base md:text-lg text-muted-foreground">
            No subscriptions. No listing fees. AgroLink takes 6% on completed orders and 12% on transport — a fraction of what middlemen charge in Accra today.
          </p>
        </header>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {ROLES.map((r) => (
            <div key={r.t} className="rounded-3xl border border-border bg-card p-7">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <r.icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 font-serif text-3xl text-foreground">{r.t}</h2>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-serif text-5xl text-foreground">{r.price}</span>
                <span className="text-sm text-muted-foreground">to join</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{r.sub}</p>
              <ul className="mt-6 space-y-2.5 text-sm">
                {r.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-foreground/85">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Fee comparison vs market */}
        <section className="mt-20 rounded-3xl border border-border bg-card p-8 md:p-12">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">The math</span>
          <h2 className="mt-3 font-serif text-4xl md:text-5xl text-foreground">
            What a <span className="italic">GHS 1,000</span> sale looks like.
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Today, between the farm gate and the kitchen door, three to four middlemen take a cut. AgroLink replaces them with a single, transparent fee.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <BreakdownCard
              title="Today (middleman chain)"
              tone="muted"
              rows={[
                { l: "Farmer keeps", v: "GHS 580", color: "bg-muted-foreground/40", pct: 58 },
                { l: "Aggregator", v: "GHS 120", color: "bg-destructive/60", pct: 12 },
                { l: "Wholesale market", v: "GHS 140", color: "bg-destructive/60", pct: 14 },
                { l: "Retailer markup", v: "GHS 160", color: "bg-destructive/60", pct: 16 },
              ]}
              footer="Farmer earns ~58%. Buyer pays full retail."
            />
            <BreakdownCard
              title="With AgroLink"
              tone="primary"
              rows={[
                { l: "Farmer keeps", v: "GHS 940", color: "bg-primary", pct: 94 },
                { l: "AgroLink fee (6%)", v: "GHS 60", color: "bg-accent", pct: 6 },
              ]}
              footer="Farmer earns 94%. Buyer pays ~15% less than the market."
            />
          </div>
        </section>

        {/* Transport rate card */}
        <section className="mt-12 rounded-3xl border border-border bg-card p-8 md:p-12">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/15 text-accent">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-3xl md:text-4xl text-foreground">Transport rate card</h2>
              <p className="mt-2 text-sm text-muted-foreground">Auto-calculated at checkout based on distance and load.</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TRANSPORT.map((row) => (
              <div key={row.range} className="rounded-2xl border border-border bg-background p-5">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{row.range}</div>
                <div className="mt-2 font-serif text-3xl text-foreground">{row.price}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-primary/40 bg-primary/5 p-8 md:p-12 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <Wallet className="h-5 w-5" />
              <span className="text-xs uppercase tracking-widest">Demo mode</span>
            </div>
            <h3 className="mt-2 font-serif text-3xl text-foreground">Test the full flow with demo MoMo</h3>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Paystack test keys are wired in for the hackathon demo. Switch to live mode in a single env flag when you're ready to take real money.
            </p>
          </div>
          <Link to="/auth" className="inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3 text-sm font-medium text-background hover:bg-foreground/90">
            Try checkout <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </SiteLayout>
  );
}

function BreakdownCard({ title, rows, footer, tone }: {
  title: string; rows: { l: string; v: string; color: string; pct: number }[]; footer: string; tone: "muted" | "primary";
}) {
  return (
    <div className={`rounded-2xl border p-6 ${tone === "primary" ? "border-primary/40 bg-primary/5" : "border-border bg-background"}`}>
      <h3 className="font-serif text-2xl">{title}</h3>
      <div className="mt-5 space-y-4">
        {rows.map((r) => (
          <div key={r.l}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground/85">{r.l}</span>
              <span className="font-medium text-foreground">{r.v}</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className={`h-full ${r.color}`} style={{ width: `${r.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs text-muted-foreground">{footer}</p>
    </div>
  );
}
