import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronUp, ChevronDown, MapPin, ShoppingBasket, Heart, Share2, BadgeCheck } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { listings } from "@/lib/mock-data";

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { title: "Market · AgroLink" },
      { name: "description", content: "Swipe through fresh produce listings from farms across Greater Accra." },
      { property: "og:title", content: "Market · AgroLink" },
      { property: "og:description", content: "Today's harvest, streaming now." },
    ],
  }),
  component: Market,
});

function Market() {
  const [index, setIndex] = useState(0);
  const item = listings[index];
  const next = () => setIndex((i) => (i + 1) % listings.length);
  const prev = () => setIndex((i) => (i - 1 + listings.length) % listings.length);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-6 py-10 md:px-12">
        <header className="mb-10">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Live market</span>
          <h1 className="mt-3 font-serif text-5xl md:text-7xl text-foreground">
            The <span className="italic">feed</span>.
          </h1>
          <p className="mt-4 max-w-xl text-sm md:text-base text-muted-foreground">
            Vertical swipe through the day's listings. Tap to add to cart.
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,420px)_1fr]">
          {/* Swipe player */}
          <div className="relative mx-auto w-full max-w-[420px]">
            <div className="relative aspect-[9/16] overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-cinema)]">
              <img
                key={item.id}
                src={item.image}
                alt={item.produce}
                className="absolute inset-0 h-full w-full object-cover animate-[cinema-fade-up_0.6s_var(--ease-cinema)_both]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
                <FeedAction icon={Heart} label="Save" />
                <FeedAction icon={Share2} label="Share" />
              </div>

              <div className="absolute inset-x-0 bottom-0 p-6">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-foreground/80">
                  <MapPin className="h-3 w-3" /> {item.location} · {item.postedHoursAgo}h ago
                </div>
                <h2 className="mt-2 font-serif text-3xl text-foreground">{item.produce}</h2>
                <Link
                  to="/farmers/$slug"
                  params={{ slug: item.farmerSlug }}
                  className="mt-1 inline-flex items-center gap-1 text-sm text-foreground/80 hover:text-primary"
                >
                  <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                  {item.farmer}
                </Link>

                <div className="mt-5 flex items-center justify-between">
                  <div>
                    <div className="font-serif text-3xl text-primary">GHS {item.pricePerKg}</div>
                    <div className="text-xs text-muted-foreground">per kg · {item.quantityKg}kg available</div>
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90">
                    <ShoppingBasket className="h-4 w-4" /> Add
                  </button>
                </div>
              </div>
            </div>

            {/* Swipe controls */}
            <div className="absolute -right-14 top-1/2 -translate-y-1/2 hidden flex-col gap-3 md:flex">
              <button onClick={prev} aria-label="Previous" className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card hover:border-primary/50 transition">
                <ChevronUp className="h-4 w-4" />
              </button>
              <button onClick={next} aria-label="Next" className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card hover:border-primary/50 transition">
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex justify-center gap-1.5 md:hidden">
              <button onClick={prev} className="rounded-full border border-border px-5 py-2 text-sm">Prev</button>
              <button onClick={next} className="rounded-full bg-foreground text-background px-5 py-2 text-sm">Next</button>
            </div>
          </div>

          {/* Up-next grid */}
          <div>
            <h3 className="font-serif text-2xl text-foreground">Up next</h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {listings.map((l, i) => (
                <button
                  key={l.id}
                  onClick={() => setIndex(i)}
                  className={`group flex items-center gap-4 rounded-2xl border p-3 text-left transition ${
                    i === index ? "border-primary/60 bg-card" : "border-border bg-card/40 hover:border-primary/30"
                  }`}
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                    <img src={l.image} alt={l.produce} loading="lazy" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-serif text-lg text-foreground truncate">{l.produce}</div>
                    <div className="text-xs text-muted-foreground truncate">{l.farmer} · {l.location}</div>
                    <div className="mt-1 text-sm text-primary">GHS {l.pricePerKg}/kg</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

function FeedAction({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <button className="flex flex-col items-center gap-1 text-foreground/80 hover:text-foreground transition" aria-label={label}>
      <span className="grid h-11 w-11 place-items-center rounded-full bg-foreground/15 backdrop-blur">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-[10px] uppercase tracking-wider">{label}</span>
    </button>
  );
}
