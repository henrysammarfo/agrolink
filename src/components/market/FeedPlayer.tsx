import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { VerticalFeed, type VerticalFeedRef, type VideoItem } from "react-vertical-feed";
import {
  PlaybackControllerProvider,
  RiyilsObserverProvider,
  RiyilsViewer,
} from "react-riyils";
import "react-riyils/dist/index.css";
import "@/styles/riyils-overrides.css";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  ShoppingBasket,
  MapPin,
  BadgeCheck,
  Volume2,
  VolumeX,
  Grid2x2,
  X,
  Send,
  Copy,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useFeed, useAddToCart } from "@/hooks/use-marketplace";
import { useAuth } from "@/lib/auth";
import { FEED_ALGORITHM_COPY } from "@/lib/feed-algorithm";
import {
  toggleLike,
  fetchUserLiked,
  fetchComments,
  addComment,
  toggleBookmark,
  fetchUserBookmarked,
} from "@/lib/api/engagement";
import type { FeedListing } from "@/lib/types/marketplace";
import type { FeedComment } from "@/lib/types/marketplace";
import { FALLBACK_PRODUCE_VIDEO, isDemoMode } from "@/lib/demo-listings";
import { getCurrentPosition } from "@/lib/native-geolocation";

export { FEED_ALGORITHM_COPY };

type Props = {
  initialIndex?: number;
  fullscreen?: boolean;
};

export function FeedPlayer({ initialIndex = 0, fullscreen = true }: Props) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | undefined>();
  const { data, isLoading, error } = useFeed(coords?.lat, coords?.lng);
  const rankedListings = data?.listings ?? [];
  const [active, setActive] = useState(initialIndex);
  const [muted, setMuted] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const feedRef = useRef<VerticalFeedRef>(null);

  useEffect(() => {
    void getCurrentPosition().then((p) => {
      if (p) setCoords({ lat: p.lat, lng: p.lng });
    });
  }, []);

  useEffect(() => {
    if (rankedListings.length && feedRef.current) {
      feedRef.current.scrollToItem(initialIndex, "auto");
    }
  }, [initialIndex, rankedListings.length]);

  const feedItems: VideoItem[] = rankedListings.map((l) => ({
    id: l.id,
    src: l.video_url ?? l.image_url ?? "",
    poster: l.image_url ?? undefined,
    muted,
    autoPlay: true,
    loop: true,
    playsInline: true,
    metadata: { listing: l },
  }));

  const wrapperClass = fullscreen
    ? "h-full w-full bg-black"
    : "relative mx-auto aspect-[9/16] w-full max-w-[420px] overflow-hidden rounded-[2rem] border border-border bg-black shadow-[var(--shadow-cinema)]";

  if (isLoading) {
    return (
      <div className={`${wrapperClass} grid place-items-center`}>
        <Loader2 className="h-8 w-8 animate-spin text-white" />
        <p className="mt-3 text-sm text-white/70">Finding fresh produce near you…</p>
      </div>
    );
  }

  if (error || (rankedListings.length === 0 && !isDemoMode())) {
    return (
      <div className={`${wrapperClass} grid place-items-center p-8 text-center`}>
        <p className="text-white font-serif text-2xl">No listings yet</p>
        <p className="mt-2 text-sm text-white/70">
          Be the first to post produce from the corridor.
        </p>
        <Link
          to="/app/create"
          className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
        >
          Post a listing
        </Link>
      </div>
    );
  }

  if (fullscreen) {
    const riyilsVideos = rankedListings.map((l) => ({
      id: l.id,
      videoUrl: l.video_url ?? FALLBACK_PRODUCE_VIDEO,
      thumbnailUrl: l.image_url ?? undefined,
    }));

    return (
      <div className={wrapperClass}>
        <PlaybackControllerProvider>
          <RiyilsObserverProvider logLevel="warn">
            <RiyilsViewer
              videos={riyilsVideos}
              initialIndex={initialIndex}
              onClose={() => {}}
              onVideoChange={setActive}
              progressBarColor="transparent"
              controls={[]}
            />
          </RiyilsObserverProvider>
        </PlaybackControllerProvider>

        {typeof document !== "undefined" &&
          rankedListings[active] &&
          createPortal(
            <div className="agrolink-feed-overlay fixed inset-0">
              <FeedCardOverlay
                item={rankedListings[active]}
                isActive
                muted={muted}
                onToggleMute={() => setMuted((m) => !m)}
                onOpenGrid={() => setShowGrid(true)}
                progress={`${active + 1} / ${rankedListings.length}`}
                showImageOnly={!rankedListings[active].video_url}
              />
            </div>,
            document.body,
          )}

        {showGrid && (
          <div className="fixed inset-0 z-[10060] bg-background/95 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-serif text-2xl">Browse all</h3>
              <button
                onClick={() => setShowGrid(false)}
                className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div
              className="grid grid-cols-2 gap-2 overflow-y-auto p-3 md:grid-cols-3 lg:grid-cols-4"
              style={{ maxHeight: "calc(100% - 60px)" }}
            >
              {rankedListings.map((l, i) => (
                <button
                  key={l.id}
                  onClick={() => {
                    setShowGrid(false);
                    setActive(i);
                  }}
                  className="relative aspect-[9/16] overflow-hidden rounded-2xl"
                >
                  <img
                    src={l.image_url ?? "/placeholder-produce.jpg"}
                    alt={l.title}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-left">
                    <div className="font-serif text-sm text-white">{l.title}</div>
                    <div className="text-[10px] text-white/70">
                      GHS {l.price_per_unit}/{l.unit}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <VerticalFeed
        ref={feedRef}
        items={feedItems}
        className="h-full w-full"
        style={{ height: "100%", scrollSnapType: "y mandatory" }}
        threshold={0.75}
        onCurrentItemChange={setActive}
        onVideoError={() => {}}
        renderItemOverlay={(item, i) => {
          const listing = (item.metadata as { listing: FeedListing }).listing;
          return (
            <FeedCardOverlay
              item={listing}
              isActive={i === active}
              muted={muted}
              onToggleMute={() => setMuted((m) => !m)}
              onOpenGrid={() => setShowGrid(true)}
              progress={`${i + 1} / ${rankedListings.length}`}
              showImageOnly={!listing.video_url}
            />
          );
        }}
      />

      <div className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 flex-col gap-1.5 md:flex z-20">
        {rankedListings.map((_, i) => (
          <span
            key={i}
            className={`block h-6 w-1 rounded-full transition-all ${i === active ? "bg-white" : "bg-white/30"}`}
          />
        ))}
      </div>

      {showGrid && (
        <div className="absolute inset-0 z-30 bg-background/95 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="font-serif text-2xl">Browse all</h3>
            <button
              onClick={() => setShowGrid(false)}
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div
            className="grid grid-cols-2 gap-2 overflow-y-auto p-3 md:grid-cols-3 lg:grid-cols-4"
            style={{ maxHeight: "calc(100% - 60px)" }}
          >
            {rankedListings.map((l, i) => (
              <button
                key={l.id}
                onClick={() => {
                  setShowGrid(false);
                  feedRef.current?.scrollToItem(i, "smooth");
                }}
                className="relative aspect-[9/16] overflow-hidden rounded-2xl"
              >
                <img
                  src={l.image_url ?? "/placeholder-produce.jpg"}
                  alt={l.title}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-left">
                  <div className="font-serif text-sm text-white">{l.title}</div>
                  <div className="text-[10px] text-white/70">
                    GHS {l.price_per_unit}/{l.unit}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FeedCardOverlay({
  item,
  isActive,
  muted,
  onToggleMute,
  onOpenGrid,
  progress,
  showImageOnly,
}: {
  item: FeedListing;
  isActive: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onOpenGrid: () => void;
  progress: string;
  showImageOnly?: boolean;
}) {
  const { user } = useAuth();
  const addToCartMut = useAddToCart();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(item.like_count);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [panel, setPanel] = useState<"comments" | "share" | null>(null);
  const sellerSlug = item.seller_slug ?? item.seller_id.slice(0, 8);
  const hoursAgo = Math.round((Date.now() - new Date(item.created_at).getTime()) / 3_600_000);

  useEffect(() => {
    if (!user?.id) return;
    fetchUserLiked(item.id, user.id).then(setLiked);
    fetchUserBookmarked(item.id, user.id).then(setSaved);
  }, [item.id, user?.id]);

  useEffect(() => {
    if (panel === "comments") fetchComments(item.id).then(setComments);
  }, [panel, item.id]);

  const handleLike = async () => {
    if (!user?.id) {
      toast.error("Sign in to like");
      return;
    }
    const next = !liked;
    setLiked(next);
    setLikes((n) => Math.max(0, n + (next ? 1 : -1)));
    try {
      await toggleLike(item.id, user.id, next);
    } catch {
      setLiked(!next);
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("Sign in to save");
      return;
    }
    const next = !saved;
    setSaved(next);
    try {
      await toggleBookmark(item.id, user.id, next);
      toast.success(next ? "Saved" : "Removed");
    } catch {
      setSaved(!next);
    }
  };

  const handleAddComment = async () => {
    if (!user?.id) {
      toast.error("Sign in to comment");
      return;
    }
    const text = commentText.trim();
    if (!text) return;
    try {
      await addComment(item.id, user.id, text);
      setComments((c) => [
        {
          id: `new-${Date.now()}`,
          user_id: user.id,
          author: "You",
          content: text,
          created_at: new Date().toISOString(),
        },
        ...c,
      ]);
      setCommentText("");
    } catch {
      toast.error("Could not post comment");
    }
  };

  const handleAddToCart = async () => {
    if (!user?.id) {
      toast.error("Sign in to add to cart");
      return;
    }
    try {
      await addToCartMut.mutateAsync({ userId: user.id, listingId: item.id, quantity: 1 });
      toast.success("Added to cart", { description: item.title });
    } catch {
      toast.error("Could not add to cart");
    }
  };

  const shareListing = async () => {
    const url = `${location.origin}/market?listing=${item.id}`;
    try {
      if (navigator.share) await navigator.share({ title: item.title, url });
      else await navigator.clipboard.writeText(url);
      toast.success("Link ready");
    } catch {
      toast.error("Share failed");
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0">
      {showImageOnly && (
        <img
          src={item.image_url ?? ""}
          alt={item.title}
          className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ${isActive ? "scale-105" : "scale-100"}`}
        />
      )}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/55 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      <div className="pointer-events-auto absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)]">
        <button
          onClick={onOpenGrid}
          className="grid h-10 w-10 place-items-center rounded-full bg-white/10 backdrop-blur text-white active:scale-95 transition"
          aria-label="Browse all"
        >
          <Grid2x2 className="h-4 w-4" />
        </button>
        <span className="text-[10px] uppercase tracking-widest text-white/70">{progress}</span>
        <button
          onClick={onToggleMute}
          className="grid h-10 w-10 place-items-center rounded-full bg-white/10 backdrop-blur text-white active:scale-95 transition"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>

      <div className="pointer-events-auto absolute right-3 bottom-28 z-10 flex flex-col items-center gap-5 md:bottom-32">
        <Link to="/farmers/$slug" params={{ slug: sellerSlug }} className="relative">
          <span className="grid h-12 w-12 place-items-center rounded-full border-2 border-white bg-primary/30 font-serif text-lg text-white overflow-hidden">
            {item.seller_avatar ? (
              <img src={item.seller_avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              (item.seller_name?.[0] ?? "?")
            )}
          </span>
        </Link>
        <Action
          icon={Heart}
          label={formatCount(likes)}
          active={liked}
          activeClass="text-rose-500 fill-rose-500"
          onClick={handleLike}
        />
        <Action
          icon={MessageCircle}
          label={formatCount(item.comment_count)}
          onClick={() => setPanel("comments")}
        />
        <Action
          icon={Bookmark}
          label="Save"
          active={saved}
          activeClass="text-amber-sun fill-amber-sun"
          onClick={handleSave}
        />
        <Action icon={Share2} label="Share" onClick={() => setPanel("share")} />
      </div>

      <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-10 p-4 pb-[max(env(safe-area-inset-bottom),72px)] pr-20 text-white md:p-6 md:pr-24">
        <Link
          to="/farmers/$slug"
          params={{ slug: sellerSlug }}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-white hover:underline"
        >
          @{sellerSlug.replace(/-/g, "")}{" "}
          {item.seller_verified && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
        </Link>
        <h2 className="mt-2 font-serif text-3xl leading-tight text-white md:text-4xl">
          {item.title}
        </h2>
        <p className="mt-1 max-w-[80%] text-sm text-white/85">
          {item.location_name} · {item.quantity}
          {item.unit} available · {hoursAgo}h ago
          {item.distance_km != null && ` · ${item.distance_km.toFixed(1)} km`}
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">
            <span className="font-serif text-xl text-white">GHS {item.price_per_unit}</span>
            <span className="ml-1 text-xs text-white/70">/{item.unit}</span>
          </div>
          <button
            onClick={handleAddToCart}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:brightness-110 active:scale-[0.98] transition"
          >
            <ShoppingBasket className="h-4 w-4" /> Add to cart
          </button>
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-white/65">
          <MapPin className="h-3 w-3" /> {item.location_name}
        </div>
      </div>

      {panel && (
        <div
          className="pointer-events-auto absolute inset-0 z-20 flex items-end bg-black/35"
          onClick={() => setPanel(null)}
        >
          <div
            className="max-h-[72%] w-full rounded-t-3xl bg-background text-foreground shadow-2xl animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-muted" />
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="font-serif text-xl">{panel === "comments" ? "Comments" : "Share"}</h3>
              <button
                onClick={() => setPanel(null)}
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {panel === "comments" ? (
              <div className="flex max-h-[calc(72vh-72px)] flex-col">
                <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-4">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 font-serif text-primary">
                        {c.author[0]}
                      </span>
                      <div>
                        <div className="text-xs font-medium">{c.author}</div>
                        <p className="mt-1 text-sm">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 border-t border-border p-3">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                    placeholder="Add a comment…"
                    className="min-w-0 flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!commentText.trim()}
                    className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-45"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 p-4 sm:grid-cols-2">
                <button
                  onClick={shareListing}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary/40"
                >
                  <Share2 className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Share</span>
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(`${location.origin}/market?listing=${item.id}`);
                    toast.success("Copied");
                  }}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary/40"
                >
                  <Copy className="h-5 w-5" />
                  <span className="text-sm font-medium">Copy link</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Action({
  icon: Icon,
  label,
  onClick,
  active,
  activeClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  active?: boolean;
  activeClass?: string;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 text-white">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-white/10 backdrop-blur transition active:scale-90">
        <Icon className={`h-6 w-6 ${active ? activeClass : ""}`} />
      </span>
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function feedScore() {
  return 0;
}
