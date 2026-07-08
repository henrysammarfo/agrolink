import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, BadgeCheck, MapPin, MessageCircle, Share2, UserPlus, UserCheck, Grid3x3, Play, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { fetchListingsBySlug } from "@/lib/api/listings";
import { fetchProfileStats } from "@/lib/api/profiles";
import { toggleFollow, fetchIsFollowing } from "@/lib/api/engagement";
import { useAuth } from "@/lib/auth";
import { MARKETING_FALLBACK_IMAGE } from "@/lib/config/site";

export const Route = createFileRoute("/farmers/$slug")({
  head: () => ({
    meta: [{ title: "Farmer profile · AgroLink" }],
  }),
  component: FarmerProfile,
});

function FarmerProfile() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { user, profile: authProfile } = useAuth();
  const qc = useQueryClient();
  const farmerSlug = slug;

  const { data, isLoading, error } = useQuery({
    queryKey: ["farmer-profile", slug],
    queryFn: () => fetchListingsBySlug(slug),
  });

  const farmerProfile = data?.profile as {
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
    queryKey: ["farmer-stats", farmerProfile?.id, farmerSlug],
    queryFn: () => fetchProfileStats(farmerProfile!.id!, farmerSlug),
    enabled: !!farmerProfile?.id,
  });

  const { data: isFollowing = false } = useQuery({
    queryKey: ["following", user?.id, farmerSlug],
    queryFn: () => fetchIsFollowing(user!.id, farmerSlug),
    enabled: !!user?.id,
  });

  const handleShare = async () => {
    const url = `${location.origin}/farmers/${slug}`;
    try {
      if (navigator.share) await navigator.share({ title: farmerProfile?.display_name ?? "Farmer", url });
      else await navigator.clipboard.writeText(url);
      toast.success("Profile link copied");
    } catch {
      toast.error("Share cancelled");
    }
  };

  const handleMessage = () => {
    if (!user?.id) {
      toast.error("Sign in to message");
      return;
    }
    if (!farmerProfile?.id) return;
    navigate({
      to: "/app/inbox/chat/$userId",
      params: { userId: farmerProfile.id },
    });
  };

  const onFollow = async () => {
    if (!user?.id) {
      toast.error("Sign in to follow");
      return;
    }
    try {
      await toggleFollow(user.id, farmerSlug, !isFollowing, authProfile?.display_name ?? undefined);
      await qc.invalidateQueries({ queryKey: ["following", user.id, farmerSlug] });
      await qc.invalidateQueries({ queryKey: ["farmer-stats", farmerProfile?.id, farmerSlug] });
      toast.success(isFollowing ? "Unfollowed" : "Following");
    } catch {
      toast.error("Could not update follow");
    }
  };

  const listings = data?.listings ?? [];
  const handle = (farmerProfile?.slug ?? slug).replace(/-/g, "");

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="grid place-items-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SiteLayout>
    );
  }

  if (error || !farmerProfile?.id) {
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
        <div className="flex items-center justify-between gap-3">
          <Link to="/farmers" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> All farmers
          </Link>
          {user && (
            <Link to="/app/buyer/feed" className="text-sm text-primary hover:underline">
              Back to feed
            </Link>
          )}
        </div>

        <div className="relative mt-5 h-40 sm:h-56 overflow-hidden rounded-3xl bg-muted">
          {farmerProfile.avatar_url ? (
            <img src={farmerProfile.avatar_url} alt="" className="h-full w-full object-cover scale-110 blur-md opacity-70" />
          ) : null}
          <div className="scrim-page-bottom" />
        </div>

        <div className="-mt-16 px-4 sm:px-8 flex flex-col items-center sm:flex-row sm:items-end sm:gap-6">
          <div className="relative">
            {farmerProfile.avatar_url ? (
              <img src={farmerProfile.avatar_url} alt={farmerProfile.display_name ?? ""} className="h-28 w-28 sm:h-32 sm:w-32 rounded-full object-cover ring-4 ring-background shadow-lg" />
            ) : (
              <span className="grid h-28 w-28 sm:h-32 sm:w-32 place-items-center rounded-full bg-card font-serif text-4xl ring-4 ring-background">
                {(farmerProfile.display_name ?? "F")[0]}
              </span>
            )}
            {farmerProfile.verified && (
              <span className="absolute bottom-1 right-1 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground ring-2 ring-background">
                <BadgeCheck className="h-4 w-4" />
              </span>
            )}
          </div>
          <div className="mt-4 sm:mt-0 flex-1 text-center sm:text-left">
            <h1 className="font-serif text-3xl sm:text-4xl text-foreground">{farmerProfile.display_name}</h1>
            <p className="text-sm text-muted-foreground">@{handle}</p>
            <p className="mt-1 inline-flex items-center justify-center sm:justify-start gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {farmerProfile.region ?? "Greater Accra"}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-2">
            <button
              onClick={onFollow}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition ${
                isFollowing ? "border border-border text-foreground hover:bg-secondary" : "bg-foreground text-background hover:bg-foreground/90"
              }`}
            >
              {isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {isFollowing ? "Following" : "Follow"}
            </button>
            <button
              onClick={handleMessage}
              className="grid h-10 w-10 place-items-center rounded-full border border-border hover:bg-secondary"
              aria-label="Message"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
            <button
              onClick={handleShare}
              className="grid h-10 w-10 place-items-center rounded-full border border-border hover:bg-secondary"
              aria-label="Share"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-8 px-4 sm:px-8 flex items-center justify-center sm:justify-start gap-10 text-center">
          <Stat n={String(stats?.followers ?? 0)} label="Followers" />
          <Stat n={String(stats?.listingCount ?? listings.length)} label="Listings" />
          <Stat n={String(stats?.totalLikes ?? 0)} label="Likes" />
          <Stat n={farmerProfile.seller_rating != null ? `${farmerProfile.seller_rating.toFixed(1)}★` : "—"} label="Rating" />
        </div>

        <p className="mt-6 px-4 sm:px-8 text-center sm:text-left text-foreground/85 max-w-2xl">
          {farmerProfile.bio ?? "Fresh produce from Greater Accra."}
        </p>

        <div className="mt-10 border-b border-border">
          <div className="flex items-center justify-center gap-8 text-sm">
            <button className="flex items-center gap-2 border-b-2 border-foreground px-2 pb-3 text-foreground">
              <Grid3x3 className="h-4 w-4" /> Posts
            </button>
          </div>
        </div>

        {/* RiyilsExplore-style grid — 3-col vertical tiles */}
        <div className="mt-5 grid grid-cols-3 gap-0.5 sm:gap-1">
          {listings.map((l) => (
            <Link
              key={l.id}
              to="/app/buyer/feed"
              className="group relative aspect-[9/16] overflow-hidden bg-muted"
            >
              <img
                src={l.image_url ?? MARKETING_FALLBACK_IMAGE}
                alt={l.title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 group-active:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/80 to-transparent p-2 transition-transform group-hover:translate-y-0">
                <div className="font-sans text-xs font-medium text-white line-clamp-1">{l.title}</div>
                <div className="text-[10px] text-white/80">GHS {l.price_per_unit}/{l.unit}</div>
              </div>
              <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded bg-black/50 px-1.5 py-0.5 text-[9px] text-white">
                <Play className="h-2.5 w-2.5 fill-current" /> {l.view_count}
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
