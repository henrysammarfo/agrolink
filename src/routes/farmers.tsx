import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, MapPin, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { farmers } from "@/lib/mock-data";

export const Route = createFileRoute("/farmers")({
  head: () => ({
    meta: [
      { title: "Farmers · AgroLink" },
      { name: "description", content: "Meet the smallholder farmers powering AgroLink across Greater Accra." },
      { property: "og:title", content: "Farmers · AgroLink" },
      { property: "og:description", content: "Profiles, ratings and stories from Greater Accra growers." },
    ],
  }),
  component: Farmers,
});

function Farmers() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-6 py-10 md:px-12">
        <header className="max-w-3xl">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Directory</span>
          <h1 className="mt-3 font-serif text-5xl md:text-7xl text-foreground">
            Our <span className="italic">farmers</span>.
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground">
            Every listing on AgroLink starts on a real farm. Browse profiles,
            ratings, and the crops growing right now.
          </p>
        </header>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {farmers.map((f) => (
            <Link
              key={f.slug}
              to="/farmers/$slug"
              params={{ slug: f.slug }}
              className="group overflow-hidden rounded-3xl border border-border bg-card transition-colors hover:border-primary/40"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img src={f.image} alt={f.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-2xl text-foreground">{f.name}</h2>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <BadgeCheck className="h-3.5 w-3.5 text-primary" /> {f.rating}
                  </span>
                </div>
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {f.location} · {f.region}
                </p>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed line-clamp-2">{f.bio}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {f.crops.slice(0, 3).map((c) => (
                    <span key={c} className="rounded-full border border-border px-3 py-1 text-[11px] text-foreground/70">
                      {c}
                    </span>
                  ))}
                </div>
                <div className="mt-6 inline-flex items-center gap-1 text-sm text-foreground group-hover:text-primary">
                  View profile <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
