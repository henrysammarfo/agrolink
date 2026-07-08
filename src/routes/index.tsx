import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Play, Leaf, Truck, Sparkles, BadgeCheck, MapPin, ShoppingBasket, Tractor, Wallet, Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { HERO_VIDEO_URL, HERO_VIDEO_FALLBACK_URL, MARKETING_FALLBACK_IMAGE } from "@/lib/config/site";
import { TESTIMONIALS, formatGmv } from "@/lib/config/marketing";
import { useFeedTeaser, useMarketingStats, usePublicSellers } from "@/hooks/use-marketplace";
import produceHero from "@/assets/produce-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgroLink — Fresh produce, delivered across Accra" },
      { name: "description", content: "TikTok-style produce marketplace connecting Accra farmers, buyers and transport partners. Discover, order, deliver." },
      { property: "og:title", content: "AgroLink — Fresh produce, delivered" },
      { property: "og:description", content: "A produce marketplace for the Greater Accra supply corridor." },
      { property: "og:image", content: produceHero },
      { name: "twitter:image", content: produceHero },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <SiteLayout overlayHeader>
      <Hero />
      <StatsStrip />
      <LiveFeedTeaser />
      <HowItWorks />
      <FeaturedFarmers />
      <Testimonials />
      <ClosingCTA />
    </SiteLayout>
  );
}

function Hero() {
  return (
    <section className="relative min-h-svh w-full overflow-hidden">
      <div
        className="absolute inset-0 h-full w-full bg-cover bg-center"
        style={{ backgroundImage: `url(${MARKETING_FALLBACK_IMAGE})` }}
        aria-hidden
      />
      <video
        autoPlay
        muted
        loop
        playsInline
        poster={produceHero}
        className="absolute inset-0 z-[1] h-full w-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      >
        <source src={HERO_VIDEO_URL} type="video/mp4" />
        <source src={HERO_VIDEO_FALLBACK_URL} type="video/mp4" />
      </video>
      <div className="pointer-events-none absolute inset-0 z-[2] bg-black/30" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-3/5 bg-gradient-to-t from-background via-background/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-40 bg-gradient-to-b from-black/55 via-black/20 to-transparent md:h-48" />

      <div className="relative z-10 flex min-h-svh flex-col pt-[5.25rem] md:pt-[5.75rem] lg:pt-24">
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-10 text-center md:px-10 md:pb-14">
          <span className="cinema-fade inline-flex max-w-[min(100%,28rem)] items-center gap-2 rounded-full border border-white/25 bg-black/30 px-4 py-1.5 text-xs font-light text-white/90 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate">Greater Accra · Agbogbloshie → Tema corridor</span>
          </span>

          <h1
            className="cinema-fade mt-5 max-w-4xl font-serif text-4xl leading-[1.05] text-white text-balance drop-shadow-sm sm:mt-6 sm:text-5xl md:text-6xl lg:text-[4.25rem]"
            style={{ animationDelay: "0.1s" }}
          >
            FRESH PRODUCE <span className="italic font-serif">for</span> BOLD
            <br />
            KITCHENS, <span className="italic font-serif">from</span> FARM
            <br />
            <span className="italic font-serif">to</span> TABLE
          </h1>

          <p
            className="cinema-fade mt-5 max-w-lg text-sm font-light leading-relaxed text-white/85 md:mt-6 md:text-base"
            style={{ animationDelay: "0.25s" }}
          >
            A TikTok-style marketplace that links smallholder farmers to
            <span className="hidden sm:inline">
              <br />
            </span>{" "}
            Accra's chefs, shops and households — with delivery built in.
          </p>

          <div
            className="cinema-fade mt-7 flex flex-col items-center gap-3 sm:mt-8 sm:flex-row sm:gap-4"
            style={{ animationDelay: "0.4s" }}
          >
            <Link
              to="/market"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-medium text-black transition-colors hover:bg-white/90"
            >
              Browse the market
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-white/45 px-7 py-3 text-sm font-medium text-white transition-colors hover:border-white/70 hover:bg-white/10"
            >
              <Play className="h-4 w-4" />
              How it works
            </Link>
          </div>
        </div>

        <div className="relative z-10 hidden items-end justify-between px-12 pb-8 text-xs font-light text-white/60 md:flex lg:px-16 lg:pb-10">
          <span>(01) — Scroll to explore</span>
          <span>Built in Accra · Powered by farmers</span>
        </div>
      </div>
    </section>
  );
}

function StatsStrip() {
  const { data: stats } = useMarketingStats();
  const items = [
    { value: stats?.sellers ? `${stats.sellers}+` : "—", label: "Sellers on platform" },
    { value: formatGmv(stats?.gmv ?? 0), label: "Paid out to farms" },
    { value: stats?.completedOrders ? `${stats.completedOrders}` : "—", label: "Completed orders" },
    { value: stats?.activeListings ? `${stats.activeListings}` : "—", label: "Live listings" },
  ];
  return (
    <section className="border-y border-border bg-card/40">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-10 px-6 py-14 md:grid-cols-4 md:px-12">
        {items.map((s) => (
          <div key={s.label} className="text-center md:text-left">
            <div className="font-serif text-4xl md:text-5xl text-foreground">{s.value}</div>
            <div className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LiveFeedTeaser() {
  const { data: listings = [], isLoading } = useFeedTeaser(6);
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 md:px-12 md:py-32">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">(02) Live feed</span>
          <h2 className="mt-3 font-serif text-4xl md:text-6xl text-foreground max-w-2xl">
            Today's harvest, <span className="italic">streaming now</span>.
          </h2>
        </div>
        <Link to="/market" className="group inline-flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
          Open full feed
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-12 flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : listings.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-dashed border-border p-16 text-center text-muted-foreground">
          No listings yet — farmers are posting the first harvest.
        </div>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <Link
              key={l.id}
              to="/market"
              className="group relative overflow-hidden rounded-3xl border border-border bg-card transition-all duration-500 hover:border-primary/40"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={l.image_url ?? MARKETING_FALLBACK_IMAGE}
                  alt={l.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-foreground/70">
                  <MapPin className="h-3 w-3" />
                  {l.location_name}
                </div>
                <h3 className="mt-2 font-serif text-2xl text-foreground">{l.title}</h3>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">by {l.seller_name ?? "Farmer"}</span>
                  <span className="font-medium text-primary">GHS {l.price_per_unit}/{l.unit}</span>
                </div>
                {l.organic && (
                  <div className="mt-3 flex gap-2">
                    <Badge tone="green">Organic</Badge>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "amber" | "green" }) {
  const styles = tone === "amber"
    ? "bg-accent/20 text-accent border-accent/30"
    : "bg-primary/15 text-primary border-primary/30";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${styles}`}>
      {children}
    </span>
  );
}

function HowItWorks() {
  const steps = [
    { icon: Tractor, title: "Farmer lists", body: "Snap a short video or photo of fresh harvest. Set quantity, price, pickup window." },
    { icon: ShoppingBasket, title: "Buyer discovers", body: "Vertical swipe feed. AI matches your kitchen to nearby supply in real time." },
    { icon: Truck, title: "We dispatch", body: "Verified drivers get auto-routed pickups. Live tracking, same-day delivery." },
    { icon: Wallet, title: "Mobile money settles", body: "Paystack + MTN MoMo + Vodafone Cash. Farmers paid the same evening." },
  ];
  return (
    <section className="border-t border-border bg-card/30">
      <div className="mx-auto max-w-7xl px-6 py-24 md:px-12 md:py-32">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">(03) How it works</span>
        <h2 className="mt-3 max-w-3xl font-serif text-4xl md:text-6xl text-foreground">
          One marketplace. <span className="italic">Three roles.</span> Built in Accra.
        </h2>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="rounded-3xl border border-border bg-background p-7">
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <span className="font-serif text-xl text-muted-foreground">0{i + 1}</span>
              </div>
              <h3 className="mt-6 font-serif text-2xl text-foreground">{s.title}</h3>
              <p className="mt-3 text-sm font-light text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedFarmers() {
  const { data: farmers = [], isLoading } = usePublicSellers(6);
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 md:px-12 md:py-32">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">(04) Farmers</span>
          <h2 className="mt-3 max-w-2xl font-serif text-4xl md:text-6xl text-foreground">
            Meet the people <span className="italic">behind</span> the harvest.
          </h2>
        </div>
        <Link to="/farmers" className="group inline-flex items-center gap-2 text-sm text-foreground hover:text-primary">
          All farmers <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-12 flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : farmers.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-dashed border-border p-16 text-center text-muted-foreground">
          Seller profiles appear here as farmers join AgroLink.
        </div>
      ) : (
        <div className="mt-12 grid gap-6 md:grid-cols-3">
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
                  <h3 className="font-serif text-2xl text-foreground">{f.display_name ?? "Farmer"}</h3>
                  {f.seller_rating != null && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                      {f.seller_rating.toFixed(1)}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                  {f.region ?? "Greater Accra"} · {f.listing_count ?? 0} listings
                </p>
                <p className="mt-4 text-sm font-light text-muted-foreground leading-relaxed line-clamp-2">
                  {f.bio ?? "Fresh produce from Greater Accra farms."}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function Testimonials() {
  return (
    <section className="border-y border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-6 py-24 md:px-12 md:py-32">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">(05) Voices</span>
        <h2 className="mt-3 max-w-3xl font-serif text-4xl md:text-6xl text-foreground">
          Trusted by chefs, growers <span className="italic">and</span> drivers.
        </h2>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <figure key={i} className="rounded-3xl border border-border bg-background p-8">
              <Leaf className="h-5 w-5 text-primary" />
              <blockquote className="mt-5 font-serif text-2xl text-foreground leading-snug">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-6 text-sm">
                <div className="text-foreground">{t.name}</div>
                <div className="text-muted-foreground">{t.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={produceHero} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/10 to-background/10" />
      </div>
      <div className="relative mx-auto max-w-3xl px-6 py-32 md:py-40 text-center">
        <div className="mx-auto inline-block rounded-3xl bg-background/70 px-8 py-10 backdrop-blur-md">
          <h2 className="font-serif text-5xl md:text-7xl text-foreground text-balance">
            Ready to <span className="italic text-primary">re-route</span> the
            <br /> Accra food <span className="italic text-accent">supply?</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-sm md:text-base text-muted-foreground">
            Join AgroLink as a farmer, buyer, or transport partner.
            Onboarding takes less than four minutes.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth" className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3 text-sm font-medium text-background hover:bg-foreground/90">
              Get started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link to="/contact" className="inline-flex items-center gap-2 rounded-full border border-foreground/30 px-7 py-3 text-sm font-medium text-foreground hover:bg-foreground/10">
              Talk to the team
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
