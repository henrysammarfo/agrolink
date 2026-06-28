import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft, BadgeCheck, MapPin, MessageCircle, Share2, UserPlus, UserCheck, Bookmark, Heart, Grid3x3, Play,
} from "lucide-react";
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
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-6 py-32 text-center">
        <h1 className="font-serif text-3xl text-foreground">Couldn't load this profile</h1>
        <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </SiteLayout>
  ),
  component: FarmerProfile,
});

function FarmerProfile() {
  const { farmer } = Route.useLoaderData();
  const theirListings = listings.filter((l) => l.farmerSlug === farmer.slug);
  const [tab, setTab] = useState<"posts" | "liked" | "reposts">("posts");
  const [following, setFollowing] = useState(false);
  const handle = farmer.slug.replace(/-/g, "");

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 pt-6 pb-20 md:px-6 md:pt-8">
        <Link to="/farmers" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All farmers
        </Link>

        {/* cover */}
        <div className="relative mt-5 h-40 sm:h-56 overflow-hidden rounded-3xl bg-muted">
          <img src={farmer.image} alt="" className="h-full w-full object-cover scale-110 blur-md opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/10 to-background" />
        </div>

        {/* avatar + actions */}
        <div className="-mt-16 px-4 sm:px-8 flex flex-col items-center sm:flex-row sm:items-end sm:gap-6">
          <div className="relative">
            <img src={farmer.image} alt={farmer.name} className="h-28 w-28 sm:h-32 sm:w-32 rounded-full object-cover ring-4 ring-background shadow-lg" />
            <span className="absolute bottom-1 right-1 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground ring-2 ring-background">
              <BadgeCheck className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 sm:mt-0 flex-1 text-center sm:text-left">
            <h1 className="font-serif text-3xl sm:text-4xl text-foreground">{farmer.name}</h1>
            <p className="text-sm text-muted-foreground">@{handle}</p>
            <p className="mt-1 inline-flex items-center justify-center sm:justify-start gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {farmer.location} · {farmer.region}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-2">
            <button
              onClick={() => setFollowing((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition ${
                following ? "border border-border text-foreground hover:bg-secondary" : "bg-foreground text-background hover:bg-foreground/90"
              }`}
            >
              {following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {following ? "Following" : "Follow"}
            </button>
            <button className="grid h-10 w-10 place-items-center rounded-full border border-border text-foreground hover:bg-secondary" aria-label="Message">
              <MessageCircle className="h-4 w-4" />
            </button>
            <button className="grid h-10 w-10 place-items-center rounded-full border border-border text-foreground hover:bg-secondary" aria-label="Share">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* stats */}
        <div className="mt-8 px-4 sm:px-8 flex items-center justify-center sm:justify-start gap-10 text-center">
          <Stat n={(farmer.reviews * 13).toLocaleString()} label="Followers" />
          <Stat n={`${theirListings.length}`} label="Listings" />
          <Stat n={`${(farmer.reviews * 47).toLocaleString()}`} label="Likes" />
          <Stat n={`${farmer.rating}★`} label="Rating" />
        </div>

        {/* bio */}
        <p className="mt-6 px-4 sm:px-8 text-center sm:text-left text-foreground/85 max-w-2xl">{farmer.bio}</p>
        <div className="mt-4 px-4 sm:px-8 flex flex-wrap justify-center sm:justify-start gap-2">
          {farmer.crops.map((c: string) => (
            <span key={c} className="rounded-full border border-border px-3 py-1 text-xs text-foreground/80">#{c.toLowerCase().replace(/\s+/g, "")}</span>
          ))}
        </div>

        {/* tabs */}
        <div className="mt-10 border-b border-border">
          <div className="flex items-center justify-center gap-8 text-sm">
            {([
              ["posts", Grid3x3, "Posts"],
              ["liked", Heart, "Liked"],
              ["reposts", Bookmark, "Saved"],
            ] as const).map(([k, Icon, label]) => (
              <button
                key={k} onClick={() => setTab(k)}
                className={`flex items-center gap-2 border-b-2 px-2 pb-3 transition ${
                  tab === k ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* grid */}
        <div className="mt-5 grid grid-cols-3 gap-1 sm:gap-2">
          {(tab === "posts" ? theirListings : []).map((l) => (
            <Link key={l.id} to="/market" className="group relative aspect-[9/16] overflow-hidden rounded-md bg-muted">
              <img src={l.image} alt={l.produce} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <div className="font-serif text-sm text-white">{l.produce}</div>
                <div className="text-[10px] text-white/80">GHS {l.pricePerKg}/kg</div>
              </div>
              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white">
                <Play className="h-3 w-3 fill-current" /> {Math.floor(Math.random() * 8) + 2}.{Math.floor(Math.random() * 9)}k
              </span>
            </Link>
          ))}
          {tab !== "posts" && (
            <div className="col-span-3 py-20 text-center text-sm text-muted-foreground">
              {tab === "liked" ? "Liked posts are private to the farmer." : "No saved posts yet."}
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="font-serif text-xl text-foreground">{n}</div>
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
