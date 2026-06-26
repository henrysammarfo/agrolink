import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ArrowRight, Truck } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing · AgroLink" },
      { name: "description", content: "Simple buyer tiers and transport rates for the AgroLink marketplace." },
      { property: "og:title", content: "Pricing · AgroLink" },
      { property: "og:description", content: "Households, restaurants and wholesale. Clear rates, no middlemen." },
    ],
  }),
  component: Pricing,
});

const TIERS = [
  {
    name: "Household",
    italic: "for home cooks",
    price: "Free",
    sub: "Pay only for produce + delivery",
    features: ["Swipe feed access", "Mobile money checkout", "Order tracking", "Up to 25kg per order"],
    cta: "Start ordering",
  },
  {
    name: "Restaurant",
    italic: "for kitchens & chefs",
    price: "GHS 120",
    sub: "/ month",
    features: ["Standing weekly orders", "Dedicated farmer matches", "Priority delivery windows", "Invoice + receipts export"],
    cta: "Start free trial",
    featured: true,
  },
  {
    name: "Wholesale",
    italic: "for shops & processors",
    price: "Custom",
    sub: "Talk to sales",
    features: ["Volume contracts", "Multi-pickup transport", "Quality-grade matching", "Dedicated account manager"],
    cta: "Contact sales",
  },
];

const TRANSPORT = [
  { range: "0 – 15 km", price: "GHS 35" },
  { range: "16 – 40 km", price: "GHS 70" },
  { range: "41 – 80 km", price: "GHS 140" },
  { range: "80 km+", price: "GHS 1.8 / km" },
];

function Pricing() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-6 py-10 md:px-12">
        <header className="max-w-3xl">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Pricing</span>
          <h1 className="mt-3 font-serif text-5xl md:text-7xl text-foreground">
            Clear rates. <span className="italic">No middlemen.</span>
          </h1>
          <p className="mt-6 text-base md:text-lg text-muted-foreground">
            Farmers keep more. Buyers pay less. AgroLink takes a thin platform fee on each order.
          </p>
        </header>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`relative flex flex-col rounded-3xl border p-8 ${
                t.featured ? "border-primary/60 bg-card shadow-[var(--shadow-glow)]" : "border-border bg-card/60"
              }`}
            >
              {t.featured && (
                <span className="absolute -top-3 left-8 rounded-full bg-primary px-3 py-1 text-[10px] uppercase tracking-widest text-primary-foreground">
                  Most popular
                </span>
              )}
              <h2 className="font-serif text-3xl text-foreground">{t.name}</h2>
              <p className="font-serif text-xl italic text-muted-foreground">{t.italic}</p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-serif text-5xl text-foreground">{t.price}</span>
                <span className="text-sm text-muted-foreground">{t.sub}</span>
              </div>
              <ul className="mt-8 space-y-3 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-foreground/85">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/auth"
                className={`mt-10 inline-flex items-center justify-center gap-2 rounded-full py-3 text-sm font-medium transition ${
                  t.featured
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "border border-border text-foreground hover:border-primary/40"
                }`}
              >
                {t.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>

        <section className="mt-24 rounded-3xl border border-border bg-card p-10 md:p-14">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/20 text-accent">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-3xl md:text-4xl text-foreground">Transport rate card</h2>
              <p className="mt-2 text-sm text-muted-foreground">Auto-calculated at checkout based on distance and load.</p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TRANSPORT.map((row) => (
              <div key={row.range} className="rounded-2xl border border-border bg-background p-5">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{row.range}</div>
                <div className="mt-2 font-serif text-3xl text-foreground">{row.price}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
