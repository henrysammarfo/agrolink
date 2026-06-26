import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronUp, ChevronDown, ShoppingBasket, MapPin } from "lucide-react";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { listings } from "@/lib/mock-data";

export const Route = createFileRoute("/app/buyer/feed")({
  head: () => ({ meta: [{ title: "Feed · AgroLink" }] }),
  component: Feed,
});

function Feed() {
  const [i, setI] = useState(0);
  const item = listings[i];
  return (
    <AppShell role="buyer">
      <PageHeader eyebrow="Live" title="Today's" italic="feed" sub="Vertical swipe through fresh listings." />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
        <div className="relative mx-auto w-full max-w-[420px]">
          <div className="relative aspect-[9/16] overflow-hidden rounded-3xl border border-border bg-card">
            <img src={item.image} alt={item.produce} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-foreground/80">
                <MapPin className="h-3 w-3" /> {item.location}
              </div>
              <h2 className="mt-2 font-serif text-3xl">{item.produce}</h2>
              <div className="mt-1 text-sm text-foreground/80">{item.farmer}</div>
              <div className="mt-5 flex items-center justify-between">
                <div className="font-serif text-3xl text-primary">GHS {item.pricePerKg}/kg</div>
                <button className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background">
                  <ShoppingBasket className="h-4 w-4" /> Add
                </button>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-center gap-2">
            <button onClick={() => setI((p) => (p - 1 + listings.length) % listings.length)} className="grid h-10 w-10 place-items-center rounded-full border border-border">
              <ChevronUp className="h-4 w-4" />
            </button>
            <button onClick={() => setI((p) => (p + 1) % listings.length)} className="grid h-10 w-10 place-items-center rounded-full border border-border">
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 self-start">
          {listings.map((l, k) => (
            <button key={l.id} onClick={() => setI(k)} className={`group overflow-hidden rounded-2xl border text-left transition ${k === i ? "border-primary/60" : "border-border hover:border-primary/30"}`}>
              <div className="aspect-[4/3] overflow-hidden">
                <img src={l.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-4">
                <div className="font-serif text-lg">{l.produce}</div>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{l.farmer}</span>
                  <span className="text-primary">GHS {l.pricePerKg}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link to="/market" className="text-sm text-muted-foreground hover:text-foreground">Open public feed →</Link>
      </div>
    </AppShell>
  );
}
