import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, Grid3x3, Bookmark, Heart, Settings, Share2, MapPin, LogOut, Play, Loader2, Eye } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { WorkspaceSwitcher } from "@/components/app/WorkspaceSwitcher";
import { RecommendedSellers } from "@/components/profile/RecommendedSellers";
import { useAuth } from "@/lib/auth";
import { useShellRole } from "@/hooks/use-shell-role";
import {
  useProfileStats, useUserListings, useUserBookmarks, useUserLikedListings, usePublicSellers,
} from "@/hooks/use-marketplace";
import { MARKETING_FALLBACK_IMAGE } from "@/lib/config/site";

export const Route = createFileRoute("/app/profile")({
  head: () => ({ meta: [{ title: "Profile · AgroLink" }] }),
  component: Profile,
});

function Profile() {
  const { profile, user, roles, signOut } = useAuth();
  const role = useShellRole();
  const [tab, setTab] = useState<"posts" | "saved" | "liked">("posts");
  const handle = profile?.username ?? profile?.slug?.replace(/-/g, "") ?? (profile?.display_name ?? user?.email ?? "you").toLowerCase().replace(/[^a-z0-9]/g, "");
  const name = profile?.display_name ?? user?.email?.split("@")[0] ?? "You";
  const publicSlug = profile?.username ?? profile?.slug ?? undefined;

  const { data: stats } = useProfileStats(user?.id, profile?.slug ?? undefined);
  const { data: posts = [], isLoading: postsLoading } = useUserListings(user?.id);
  const { data: saved = [] } = useUserBookmarks(user?.id);
  const { data: liked = [] } = useUserLikedListings(user?.id);
  const { data: sellers = [] } = usePublicSellers(8);

  const gridItems = tab === "posts" ? posts : tab === "saved" ? saved : liked;

  const shareProfile = async () => {
    const url = publicSlug
      ? `${window.location.origin}/app/users/${publicSlug}`
      : `${window.location.origin}/app/profile`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${name} on AgroLink`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Profile link copied");
      }
    } catch {
      /* user cancelled share */
    }
  };

  return (
    <AppShell role={role} compact>
      <PageHeader
        eyebrow="Account"
        title="Your"
        italic="profile"
        sub="Posts, saves, and people who follow you — share the public link anytime."
      />

      <div className="flex flex-col items-center gap-[var(--space-block)] sm:flex-row sm:items-end sm:gap-6">
        <div className="relative shrink-0">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-20 w-20 sm:h-28 sm:w-28 rounded-full object-cover ring-4 ring-background shadow" />
          ) : (
            <span className="grid h-20 w-20 sm:h-28 sm:w-28 place-items-center rounded-full bg-card font-serif text-3xl sm:text-4xl text-primary ring-4 ring-background shadow">
              {name[0].toUpperCase()}
            </span>
          )}
          <span className="absolute bottom-0 right-0 grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-full bg-primary text-primary-foreground ring-2 ring-background">
            <BadgeCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </span>
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h2 className="font-serif text-2xl sm:text-3xl text-foreground">{name}</h2>
          <p className="truncate text-sm text-muted-foreground">@{handle}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" /> {profile?.region ?? "Greater Accra"}
          </p>
        </div>
      </div>

      <div className="mt-[var(--space-block)] w-full overflow-x-auto no-scrollbar">
        <div className="flex min-w-min items-center justify-center gap-2 sm:justify-start">
          <Link
            to="/app/settings"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm font-medium text-background"
          >
            <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Edit
          </Link>
          <Link
            to="/app/profile/views"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm font-medium hover:bg-secondary"
          >
            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Views
          </Link>
          <button
            type="button"
            onClick={() => void shareProfile()}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border sm:h-10 sm:w-10"
            aria-label="Share profile"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-[var(--space-block)] flex items-center justify-center gap-8 sm:justify-start sm:gap-10 text-center">
        <Link to="/app/profile/following" className="hover:opacity-80">
          <Stat n={String(stats?.following ?? 0)} label="Following" />
        </Link>
        <Link to="/app/profile/followers" className="hover:opacity-80">
          <Stat n={String(stats?.followers ?? 0)} label="Followers" />
        </Link>
        <Stat n={String(stats?.completedTrades ?? 0)} label="Trades" />
      </div>

      <p className="mt-4 text-sm sm:text-base text-foreground/80 max-w-xl text-center sm:text-left">
        {profile?.bio ?? "Welcome to AgroLink. Update your bio in settings."}
      </p>

      {roles.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
          {roles.map((r) => (
            <span key={r} className="rounded-full border border-border bg-card px-3 py-1 text-xs capitalize">{r}</span>
          ))}
        </div>
      )}

      <div className="mt-6">
        <WorkspaceSwitcher compact />
      </div>

      <RecommendedSellers sellers={sellers} excludeUserId={user?.id} />

      <div className="mt-8 border-b border-border">
        <div className="flex items-center justify-center gap-6 sm:gap-8 text-sm">
          {([["posts", Grid3x3, "Posts"], ["saved", Bookmark, "Saved"], ["liked", Heart, "Liked"]] as const).map(([k, Icon, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`flex items-center gap-1.5 border-b-2 px-1 pb-3 transition sm:gap-2 sm:px-2 ${
                tab === k ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {postsLoading ? (
        <div className="mt-6 flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-0.5 sm:gap-2">
          {gridItems.map((l) => (
            <Link key={l.id} to="/app/buyer/feed" className="relative aspect-[9/16] overflow-hidden rounded-sm sm:rounded-md bg-muted">
              <img src={l.image_url ?? MARKETING_FALLBACK_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
              <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-black/40 px-1.5 py-0.5 text-[9px] text-white sm:left-2 sm:top-2 sm:px-2 sm:text-[10px]">
                <Play className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-current" /> {l.view_count}
              </span>
            </Link>
          ))}
          {gridItems.length === 0 && (
            <div className="col-span-3 py-12 text-center text-sm text-muted-foreground">Nothing here yet.</div>
          )}
        </div>
      )}

      <div className="mt-8 mb-2 flex justify-center sm:mb-4">
        <button
          onClick={() => signOut()}
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground hover:border-destructive/40 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </AppShell>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="font-serif text-lg sm:text-xl text-foreground">{n}</div>
      <div className="text-[10px] sm:text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
