import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Tractor, ShoppingBasket, Truck, ArrowRight, Camera, MapPin, Wallet, Sparkles,
  Brain, BadgePercent, Workflow, Bell, ShieldCheck, Smartphone,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works · AgroLink" },
      { name: "description", content: "How AgroLink connects farmers, buyers, and transport partners across Greater Accra." },
      { property: "og:title", content: "How it works · AgroLink" },
      { property: "og:description", content: "Three roles, one marketplace. See how AgroLink works." },
    ],
  }),
  component: HowItWorks,
});

const ROLES = [
  {
    key: "farmer", icon: Tractor, title: "Farmers", italic: "list. sell. get paid.",
    steps: [
      { icon: Camera, t: "Snap & list", d: "Photo or short video of harvest, set price and quantity. Phone-first — WhatsApp when it sells." },
      { icon: Brain, t: "Optional price tip", d: "Optional market-price tip for tomato and leafy greens on the Dodowa–Tema–Accra corridor. You set the price." },
      { icon: Wallet, t: "Same-evening payout", d: "MTN MoMo, Vodafone Cash, AirtelTigo. Money lands the same evening — no waiting." },
    ],
  },
  {
    key: "buyer", icon: ShoppingBasket, title: "Buyers", italic: "discover. order. receive.",
    steps: [
      { icon: Sparkles, t: "Browse the feed", d: "Vertical produce feed for kitchens. Save what you like, follow farmers you trust." },
      { icon: ShoppingBasket, t: "One-tap cart", d: "Order tomato and greens for your restaurant or chop bar. Pay on mobile money." },
      { icon: MapPin, t: "Live tracking", d: "Watch your driver from pickup to drop-off with proof of delivery." },
    ],
  },
  {
    key: "transport", icon: Truck, title: "Transport partners", italic: "drive. deliver. earn.",
    steps: [
      { icon: Workflow, t: "Pick a job", d: "Live job board with payouts, distance and pickup window. Accept in one tap." },
      { icon: MapPin, t: "Auto-routed", d: "Multi-pickup runs optimised by mileage. Built-in navigation, dynamic ETA." },
      { icon: Wallet, t: "Daily payouts", d: "Paid same evening to MoMo. Higher rating unlocks bigger runs." },
    ],
  },
];

const PILLARS = [
  { icon: BadgePercent, t: "Transparent fee", d: "A thin service fee (about 6%) on each completed order. No subscriptions, no listing fee. Ever." },
  { icon: Bell, t: "Real-time alerts", d: "WhatsApp + push for orders and dispatch. Farmers are never email-first." },
  { icon: ShieldCheck, t: "Verified network", d: "Farmers, buyers and drivers are phone- and ID-verified before they can transact." },
  { icon: Smartphone, t: "Built for the market", d: "Designed for low-bandwidth phones. Big buttons, English + visual cues — WhatsApp when it matters." },
];

function HowItWorks() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-6 py-10 md:px-12">
        <header className="max-w-3xl">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">How it works</span>
          <h1 className="mt-3 font-serif text-5xl md:text-7xl text-foreground text-balance">
            Three roles. <span className="italic">One marketplace.</span>
          </h1>
          <p className="mt-6 text-base md:text-lg text-muted-foreground">
            AgroLink moves tomato and leafy greens from peri-urban farms (Dodowa corridor) to
            Accra restaurants and chop bars — MoMo, same-day dispatch, proof of delivery.
          </p>
        </header>

        {/* 3-step horizontal timeline */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {ROLES.map((r, i) => (
            <Link key={r.key} to="/auth" className="group relative rounded-3xl border border-border bg-card p-7 transition hover:border-primary/40 hover:-translate-y-0.5">
              <span className="font-serif text-7xl text-primary/15 leading-none">0{i + 1}</span>
              <div className="-mt-8 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <r.icon className="h-6 w-6" />
              </div>
              <h2 className="mt-6 font-serif text-3xl text-foreground">{r.title}</h2>
              <p className="mt-1 font-serif text-lg italic text-muted-foreground">{r.italic}</p>
              <p className="mt-6 inline-flex items-center gap-1 text-sm text-foreground/80 group-hover:text-primary">
                I'm a {r.title.toLowerCase().replace(" partners", "")} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </p>
            </Link>
          ))}
        </div>

        {/* deep-dive per role */}
        <div className="mt-20 space-y-24">
          {ROLES.map((r, i) => (
            <section key={r.key} className="grid gap-10 lg:grid-cols-[280px_1fr]">
              <div>
                <span className="block text-xs uppercase tracking-widest text-muted-foreground">0{i + 1} / Walkthrough</span>
                <h2 className="mt-2 font-serif text-4xl md:text-5xl text-foreground">{r.title}</h2>
                <p className="mt-2 font-serif text-2xl italic text-muted-foreground">{r.italic}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {r.steps.map((s, j) => (
                  <div key={s.t} className="relative rounded-3xl border border-border bg-card p-6">
                    <span className="absolute right-5 top-5 font-serif text-2xl text-muted-foreground/40">{j + 1}</span>
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 font-serif text-xl text-foreground">{s.t}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* pillars */}
        <section className="mt-24 rounded-3xl border border-border bg-card/60 p-10 md:p-14">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Why it works</span>
          <h2 className="mt-3 font-serif text-4xl md:text-5xl text-foreground">
            Simple <span className="italic">on purpose</span>.
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p) => (
              <div key={p.t}>
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-accent">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-serif text-xl text-foreground">{p.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-20 rounded-3xl border border-border bg-card p-10 md:p-14 text-center">
          <h3 className="font-serif text-3xl md:text-5xl text-foreground">
            Pick your <span className="italic">side</span>.
          </h3>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Free to join. Less than four minutes. No card required.
          </p>
          <Link to="/auth" className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3 text-sm font-medium text-background hover:bg-foreground/90">
            Create your account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}
