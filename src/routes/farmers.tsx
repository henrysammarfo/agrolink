import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, MapPin, ArrowRight, Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { usePublicSellers } from "@/hooks/use-marketplace";

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
  const { data: farmers = [], isLoading } = usePublicSellers(24);

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

        {isLoading ? (
          <div className="mt-16 flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : farmers.length === 0 ? (
          <div className="mt-16 rounded-3xl border border-dashed border-border p-16 text-center text-muted-foreground">
            No farms listed yet. Check back soon — or start shopping the live feed.
          </div>
        ) : (
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {farmers.map((f) => (
              <Link
                key={f.id}
                to="/farmers/$slug"
                params={{ slug: f.slug ?? f.id }}
                className="group overflow-hidden rounded-3xl border border-border bg-card transition-colors hover:border-primary/40"
              >
                <div className="aspect-[4/5] overflow-hidden bg-muted">
                  {f.avatar_url ? (
                    <img src={f.avatar_url} alt={f.display_name ?? ""} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="grid h-full place-items-center font-serif text-6xl text-primary/30">
                      {(f.display_name ?? "F")[0]}
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-2xl text-foreground">{f.display_name ?? "Farmer"}</h2>
                    {f.seller_rating != null && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <BadgeCheck className="h-3.5 w-3.5 text-primary" /> {f.seller_rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {f.region ?? "Greater Accra"}
                  </p>
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {f.bio ?? "Fresh produce seller on AgroLink."}
                  </p>
                  <div className="mt-5 text-xs text-muted-foreground">{f.listing_count ?? 0} active listings</div>
                  <div className="mt-6 inline-flex items-center gap-1 text-sm text-foreground group-hover:text-primary">
                    View profile <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
