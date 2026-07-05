import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BadgeCheck, Grid3x3, Bookmark, Heart, Settings, Share2, MapPin, LogOut, Play, Loader2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
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
  const [tab, setTab] = useState<"posts" | "saved" | "liked">("posts");
  const role = roles.includes("farmer") ? "farmer" : roles.includes("transport") ? "transport" : "buyer";
  const handle = (profile?.display_name ?? user?.email ?? "you").toLowerCase().replace(/[^a-z0-9]/g, "");
  const name = profile?.display_name ?? user?.email?.split("@")[0] ?? "You";

  const { data: stats } = useProfileStats(user?.id);
  const { data: posts = [], isLoading: postsLoading } = useUserListings(user?.id);
  const { data: saved = [] } = useUserBookmarks(user?.id);
  const { data: liked = [] } = useUserLikedListings(user?.id);
  const { data: sellers = [] } = usePublicSellers(4);

  const gridItems = tab === "posts" ? posts : tab === "saved" ? saved : liked;

  return (
    <AppShell role={role}>
      <PageHeader eyebrow="Profile" title="Your" italic="profile" />

      <div className="relative h-32 sm:h-44 overflow-hidden rounded-3xl bg-gradient-to-br from-primary/30 via-accent/20 to-background" />

      <div className="-mt-12 px-4 sm:px-8 flex flex-col items-center sm:flex-row sm:items-end sm:gap-6">
        <div className="relative">
          <span className="grid h-24 w-24 sm:h-28 sm:w-28 place-items-center rounded-full bg-card font-serif text-4xl text-primary ring-4 ring-background shadow">
            {name[0].toUpperCase()}
          </span>
          <span className="absolute bottom-1 right-1 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground ring-2 ring-background">
            <BadgeCheck className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-4 sm:mt-0 flex-1 text-center sm:text-left">
          <h2 className="font-serif text-3xl text-foreground">{name}</h2>
          <p className="text-sm text-muted-foreground">@{handle}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {profile?.region ?? "Greater Accra"}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-2">
          <Link to="/app/settings" className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background">
            <Settings className="h-4 w-4" /> Edit profile
          </Link>
          <button className="grid h-10 w-10 place-items-center rounded-full border border-border" aria-label="Share">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center sm:justify-start gap-10 px-4 sm:px-8 text-center">
        <Stat n={String(stats?.following ?? 0)} label="Following" />
        <Stat n={String(stats?.followers ?? 0)} label="Followers" />
        <Stat n={String(stats?.totalLikes ?? 0)} label="Likes" />
      </div>

      <p className="mt-5 px-4 sm:px-8 text-foreground/80 max-w-xl">
        {profile?.bio ?? "Welcome to AgroLink. Update your bio in settings."}
      </p>

      <div className="mt-4 px-4 sm:px-8 flex flex-wrap gap-2">
        {roles.map((r) => (
          <span key={r} className="rounded-full border border-border bg-card px-3 py-1 text-xs capitalize">{r}</span>
        ))}
      </div>

      {sellers.length > 0 && (
        <div className="mt-8 rounded-3xl border border-border bg-card p-5">
          <h3 className="font-serif text-lg">Recommended sellers</h3>
          <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-4">
            {sellers.filter((s) => s.id !== user?.id).slice(0, 4).map((s) => (
              <Link key={s.id} to="/farmers/$slug" params={{ slug: s.slug ?? s.id }} className="rounded-2xl border border-border bg-background p-3 hover:border-primary/40">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/15 font-serif text-primary">{(s.display_name ?? "F")[0]}</span>
                <div className="mt-3 truncate text-sm font-medium">{s.display_name}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 border-b border-border">
        <div className="flex items-center justify-center gap-8 text-sm">
          {([["posts", Grid3x3, "Posts"], ["saved", Bookmark, "Saved"], ["liked", Heart, "Liked"]] as const).map(([k, Icon, label]) => (
            <button key={k} onClick={() => setTab(k)} className={`flex items-center gap-2 border-b-2 px-2 pb-3 transition ${tab === k ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"}`}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {postsLoading ? (
        <div className="mt-8 flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="mt-5 grid grid-cols-3 gap-1 sm:gap-2">
          {gridItems.map((l) => (
            <Link key={l.id} to="/app/buyer/feed" className="relative aspect-[9/16] overflow-hidden rounded-md bg-muted">
              <img src={l.image_url ?? MARKETING_FALLBACK_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white">
                <Play className="h-3 w-3 fill-current" /> {l.view_count}
              </span>
            </Link>
          ))}
          {gridItems.length === 0 && (
            <div className="col-span-3 py-16 text-center text-sm text-muted-foreground">Nothing here yet.</div>
          )}
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <button onClick={() => signOut()} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground hover:border-destructive/40 hover:text-destructive">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </AppShell>
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
