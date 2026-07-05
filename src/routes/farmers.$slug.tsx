import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, BadgeCheck, MapPin, MessageCircle, Share2, UserPlus, Grid3x3, Play, Loader2,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { fetchListingsBySlug } from "@/lib/api/listings";
import { fetchProfileStats } from "@/lib/api/profiles";
import { MARKETING_FALLBACK_IMAGE } from "@/lib/config/site";

export const Route = createFileRoute("/farmers/$slug")({
  head: () => ({
    meta: [{ title: "Farmer profile · AgroLink" }],
  }),
  component: FarmerProfile,
});

function FarmerProfile() {
  const { slug } = Route.useParams();
  const [tab, setTab] = useState<"posts">("posts");

  const { data, isLoading, error } = useQuery({
    queryKey: ["farmer-profile", slug],
    queryFn: () => fetchListingsBySlug(slug),
  });

  const profile = data?.profile as {
    id?: string;
    display_name?: string;
    avatar_url?: string;
    bio?: string;
    region?: string;
    slug?: string;
    seller_rating?: number;
    verified?: boolean;
  } | undefined;

  const { data: stats } = useQuery({
    queryKey: ["farmer-stats", profile?.id],
    queryFn: () => fetchProfileStats(profile!.id!),
    enabled: !!profile?.id,
  });

  const listings = data?.listings ?? [];
  const handle = (profile?.slug ?? slug).replace(/-/g, "");

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="grid place-items-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SiteLayout>
    );
  }

  if (error || !profile?.id) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-6 py-32 text-center">
          <h1 className="font-serif text-5xl text-foreground">Farmer not found</h1>
          <Link to="/farmers" className="mt-6 inline-flex items-center gap-2 text-primary">
            <ArrowLeft className="h-4 w-4" /> Back to farmers
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 pt-6 pb-20 md:px-6 md:pt-8">
        <Link to="/farmers" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All farmers
        </Link>

        <div className="relative mt-5 h-40 sm:h-56 overflow-hidden rounded-3xl bg-muted">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover scale-110 blur-md opacity-70" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/10 to-background" />
        </div>

        <div className="-mt-16 px-4 sm:px-8 flex flex-col items-center sm:flex-row sm:items-end sm:gap-6">
          <div className="relative">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name ?? ""} className="h-28 w-28 sm:h-32 sm:w-32 rounded-full object-cover ring-4 ring-background shadow-lg" />
            ) : (
              <span className="grid h-28 w-28 sm:h-32 sm:w-32 place-items-center rounded-full bg-card font-serif text-4xl ring-4 ring-background">
                {(profile.display_name ?? "F")[0]}
              </span>
            )}
            {profile.verified && (
              <span className="absolute bottom-1 right-1 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground ring-2 ring-background">
                <BadgeCheck className="h-4 w-4" />
              </span>
            )}
          </div>
          <div className="mt-4 sm:mt-0 flex-1 text-center sm:text-left">
            <h1 className="font-serif text-3xl sm:text-4xl text-foreground">{profile.display_name}</h1>
            <p className="text-sm text-muted-foreground">@{handle}</p>
            <p className="mt-1 inline-flex items-center justify-center sm:justify-start gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {profile.region ?? "Greater Accra"}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background">
              <UserPlus className="h-4 w-4" /> Follow
            </button>
            <button className="grid h-10 w-10 place-items-center rounded-full border border-border" aria-label="Message">
              <MessageCircle className="h-4 w-4" />
            </button>
            <button className="grid h-10 w-10 place-items-center rounded-full border border-border" aria-label="Share">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-8 px-4 sm:px-8 flex items-center justify-center sm:justify-start gap-10 text-center">
          <Stat n={String(stats?.followers ?? 0)} label="Followers" />
          <Stat n={String(stats?.listingCount ?? listings.length)} label="Listings" />
          <Stat n={String(stats?.totalLikes ?? 0)} label="Likes" />
          <Stat n={profile.seller_rating != null ? `${profile.seller_rating.toFixed(1)}★` : "—"} label="Rating" />
        </div>

        <p className="mt-6 px-4 sm:px-8 text-center sm:text-left text-foreground/85 max-w-2xl">
          {profile.bio ?? "Fresh produce from Greater Accra."}
        </p>

        <div className="mt-10 border-b border-border">
          <div className="flex items-center justify-center gap-8 text-sm">
            <button className="flex items-center gap-2 border-b-2 border-foreground px-2 pb-3 text-foreground">
              <Grid3x3 className="h-4 w-4" /> Posts
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-1 sm:gap-2">
          {listings.map((l) => (
            <Link key={l.id} to="/market" className="group relative aspect-[9/16] overflow-hidden rounded-md bg-muted">
              <img
                src={l.image_url ?? MARKETING_FALLBACK_IMAGE}
                alt={l.title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <div className="font-serif text-sm text-white">{l.title}</div>
                <div className="text-[10px] text-white/80">GHS {l.price_per_unit}/{l.unit}</div>
              </div>
              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white">
                <Play className="h-3 w-3 fill-current" /> {l.view_count}
              </span>
            </Link>
          ))}
          {listings.length === 0 && (
            <div className="col-span-3 py-20 text-center text-sm text-muted-foreground">No posts yet.</div>
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
