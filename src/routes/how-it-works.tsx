import { createFileRoute, Link } from "@tanstack/react-router";
import { Tractor, ShoppingBasket, Truck, ArrowRight, Camera, MapPin, Wallet, Sparkles } from "lucide-react";
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
    key: "farmer",
    icon: Tractor,
    title: "Farmers",
    italic: "list, sell, get paid",
    steps: [
      { icon: Camera, t: "Snap & list", d: "Open the app, record a 10-second video of fresh harvest, set price and quantity." },
      { icon: Sparkles, t: "AI pricing", d: "We benchmark today's wholesale prices in Agbogbloshie and Tema and suggest a fair rate." },
      { icon: Wallet, t: "Same-day payout", d: "Hubtel + MTN MoMo + Vodafone Cash. Money lands the same evening." },
    ],
  },
  {
    key: "buyer",
    icon: ShoppingBasket,
    title: "Buyers",
    italic: "discover, order, receive",
    steps: [
      { icon: Sparkles, t: "Swipe the feed", d: "TikTok-style vertical feed. AI matches your kitchen to nearby farms in real time." },
      { icon: ShoppingBasket, t: "One-tap cart", d: "Combine multiple farmers in a single order. Pay on mobile money in checkout." },
      { icon: MapPin, t: "Live tracking", d: "Watch your driver from pickup to drop-off. Average door time: 38 minutes." },
    ],
  },
  {
    key: "transport",
    icon: Truck,
    title: "Transport partners",
    italic: "drive, deliver, earn",
    steps: [
      { icon: Truck, t: "Pick a job", d: "Live job board with payouts, distance and pickup window. Accept in one tap." },
      { icon: MapPin, t: "Auto-routed", d: "Google Maps routing optimized for multi-pickup runs." },
      { icon: Wallet, t: "Daily payouts", d: "Paid same evening on MoMo. Build a rating, get priority on bigger runs." },
    ],
  },
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
            AgroLink connects smallholder farms with the kitchens, shops and households of
            Greater Accra — with mobile money payment and transport built in.
          </p>
        </header>

        <div className="mt-20 space-y-24">
          {ROLES.map((r, i) => (
            <section key={r.key} className="grid gap-10 lg:grid-cols-[280px_1fr]">
              <div>
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
                  <r.icon className="h-6 w-6" />
                </div>
                <span className="mt-6 block text-xs uppercase tracking-widest text-muted-foreground">0{i + 1}</span>
                <h2 className="mt-2 font-serif text-4xl md:text-5xl text-foreground">
                  {r.title}
                </h2>
                <p className="mt-2 font-serif text-2xl italic text-muted-foreground">{r.italic}.</p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {r.steps.map((s) => (
                  <div key={s.t} className="rounded-3xl border border-border bg-card p-6">
                    <s.icon className="h-5 w-5 text-primary" />
                    <h3 className="mt-5 font-serif text-xl text-foreground">{s.t}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-24 rounded-3xl border border-border bg-card p-10 md:p-14 text-center">
          <h3 className="font-serif text-3xl md:text-5xl text-foreground">
            Pick your <span className="italic">side</span>.
          </h3>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Join the marketplace in under four minutes. No credit card required.
          </p>
          <Link to="/auth" className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3 text-sm font-medium text-background hover:bg-foreground/90">
            Create your account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}
