import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, MapPin, Sprout, MessageCircle } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { farmers, listings } from "@/lib/mock-data";

export const Route = createFileRoute("/farmers/$slug")({
  loader: ({ params }) => {
    const farmer = farmers.find((f) => f.slug === params.slug);
    if (!farmer) throw notFound();
    return { farmer };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.farmer.name ?? "Farmer"} · AgroLink` },
      { name: "description", content: loaderData?.farmer.bio ?? "" },
      { property: "og:title", content: `${loaderData?.farmer.name ?? "Farmer"} · AgroLink` },
      { property: "og:description", content: loaderData?.farmer.bio ?? "" },
      { property: "og:image", content: loaderData?.farmer.image ?? "" },
    ],
  }),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-6 py-32 text-center">
        <h1 className="font-serif text-5xl text-foreground">Farmer not found</h1>
        <Link to="/farmers" className="mt-6 inline-flex items-center gap-2 text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to farmers
        </Link>
      </div>
    </SiteLayout>
  ),
  component: FarmerProfile,
});

function FarmerProfile() {
  const { farmer } = Route.useLoaderData();
  const theirListings = listings.filter((l) => l.farmerSlug === farmer.slug);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-6 py-10 md:px-12">
        <Link to="/farmers" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All farmers
        </Link>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div className="overflow-hidden rounded-3xl border border-border">
            <img src={farmer.image} alt={farmer.name} className="h-full w-full object-cover" />
          </div>

          <div>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Profile</span>
            <h1 className="mt-3 font-serif text-5xl md:text-7xl text-foreground">{farmer.name}</h1>
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {farmer.location} · {farmer.region}
            </p>

            <div className="mt-8 flex flex-wrap gap-6">
              <Stat label="Rating" value={`${farmer.rating} ★`} sub={`${farmer.reviews} reviews`} />
              <Stat label="Experience" value={`${farmer.yearsFarming} yrs`} sub="Farming" />
              <Stat label="Active listings" value={`${theirListings.length}`} sub="This week" />
            </div>

            <p className="mt-10 text-base text-foreground/85 leading-relaxed">{farmer.bio}</p>

            <div className="mt-8">
              <h3 className="font-serif text-xl text-foreground inline-flex items-center gap-2">
                <Sprout className="h-4 w-4 text-primary" /> Crops
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {farmer.crops.map((c) => (
                  <span key={c} className="rounded-full border border-border px-3 py-1 text-xs text-foreground/80">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/market" className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:bg-foreground/90">
                See listings
              </Link>
              <button className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm text-foreground hover:border-primary/50">
                <MessageCircle className="h-4 w-4" /> Message
              </button>
            </div>
          </div>
        </div>

        <section className="mt-24">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground">
            <BadgeCheck className="inline h-6 w-6 text-primary mr-2" />
            Active listings
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {theirListings.map((l) => (
              <Link key={l.id} to="/market" className="group overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/40 transition">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={l.image} alt={l.produce} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-xl text-foreground">{l.produce}</h3>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{l.quantityKg}kg available</span>
                    <span className="text-primary">GHS {l.pricePerKg}/kg</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-serif text-3xl text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
