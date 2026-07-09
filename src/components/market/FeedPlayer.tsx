import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo } from "react";
import { VerticalFeed, type VerticalFeedRef, type VideoItem } from "react-vertical-feed";
import "@/styles/riyils-overrides.css";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  ShoppingBasket,
  BadgeCheck,
  Volume2,
  VolumeX,
  Grid2x2,
  X,
  Send,
  Copy,
  Plus,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useFeed, useAddToCart } from "@/hooks/use-marketplace";
import { useAuth } from "@/lib/auth";
import { trackEvent } from "@/lib/analytics";
import { FEED_ALGORITHM_COPY } from "@/lib/feed-algorithm";
import {
  toggleLike,
  fetchUserLiked,
  fetchComments,
  addComment,
  toggleBookmark,
  fetchUserBookmarked,
  toggleFollow,
  fetchIsFollowing,
} from "@/lib/api/engagement";
import type { FeedListing } from "@/lib/types/marketplace";
import type { FeedComment } from "@/lib/types/marketplace";
import { isSeedFeedEnabled, isSeedListingId } from "@/lib/demo-listings";
import { isValidUserId } from "@/lib/api/cart";
import { getCurrentPosition } from "@/lib/native-geolocation";
import { triggerLikeHaptic } from "@/lib/haptics";
import { FeedSkeleton } from "@/components/feed/FeedSkeleton";
import { CategoryChips, filterByCategory } from "@/components/feed/CategoryChips";

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
  const [category, setCategory] = useState("all");
  const feedRef = useRef<VerticalFeedRef>(null);

  const filteredListings = useMemo(
    () => filterByCategory(rankedListings, category),
    [rankedListings, category],
  );

  useEffect(() => {
    void getCurrentPosition().then((p) => {
      if (p) setCoords({ lat: p.lat, lng: p.lng });
    });
    trackEvent("feed_view");
  }, []);

  useEffect(() => {
    if (filteredListings.length && feedRef.current) {
      feedRef.current.scrollToItem(initialIndex, "auto");
    }
  }, [initialIndex, filteredListings.length]);

  const feedItems: VideoItem[] = filteredListings.map((l) => ({
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
      <div className={wrapperClass}>
        <FeedSkeleton />
      </div>
    );
  }

  if (error || (filteredListings.length === 0 && !isSeedFeedEnabled())) {
    return (
      <div className={`${wrapperClass} grid place-items-center p-8 text-center`}>
        <p className="text-white font-sans text-2xl font-semibold">No listings yet</p>
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
            <>
              {i === 0 && <CategoryChips active={category} onChange={setCategory} />}
              <FeedCardOverlay
                item={listing}
                isActive={i === active}
                muted={muted}
                onToggleMute={() => setMuted((m) => !m)}
                onOpenGrid={() => setShowGrid(true)}
                progress={`${i + 1} / ${filteredListings.length}`}
                showImageOnly={!listing.video_url}
              />
            </>
          );
        }}
      />

      <div className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 flex-col gap-1.5 md:flex z-20">
        {filteredListings.map((_, i) => (
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
            {filteredListings.map((l, i) => (
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
                <div className="scrim-bottom-dark" />
                <div className="absolute inset-x-0 bottom-0 p-2 text-left">
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
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const addToCartMut = useAddToCart();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(item.like_count);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [panel, setPanel] = useState<"comments" | "share" | null>(null);
  const [showLikeBurst, setShowLikeBurst] = useState(false);
  const [following, setFollowing] = useState(false);
  const lastTap = useRef(0);
  const sellerSlug = item.seller_slug?.trim().toLowerCase() || null;
  const profileHandle = sellerSlug ?? item.seller_id;
  const followKey = sellerSlug ?? item.seller_id ?? "";
  const sellerHandle = (item.seller_slug ?? item.seller_name ?? "seller").replace(/-/g, "").slice(0, 20);
  const isSelf = user?.id === item.seller_id;
  const hoursAgo = Math.round((Date.now() - new Date(item.created_at).getTime()) / 3_600_000);
  const isDemoListing = isSeedListingId(item.id);

  useEffect(() => {
    if (!user?.id || isDemoListing || !followKey || isSelf) return;
    fetchIsFollowing(user.id, followKey).then(setFollowing);
  }, [item.id, user?.id, isDemoListing, followKey, isSelf]);

  useEffect(() => {
    if (!user?.id || isDemoListing) return;
    fetchUserLiked(item.id, user.id).then(setLiked);
    fetchUserBookmarked(item.id, user.id).then(setSaved);
  }, [item.id, user?.id, isDemoListing]);

  useEffect(() => {
    if (panel !== "comments" || isDemoListing) return;
    fetchComments(item.id).then(setComments);
  }, [panel, item.id, isDemoListing]);

  const handleLike = async () => {
    if (!user?.id) {
      toast.error("Sign in to like");
      return;
    }
    const next = !liked;
    setLiked(next);
    setLikes((n) => Math.max(0, n + (next ? 1 : -1)));
    if (isDemoListing) {
      triggerLikeHaptic();
      return;
    }
    try {
      await toggleLike(item.id, user.id, next, {
        sellerId: item.seller_id,
        listingTitle: item.title,
        actorName: profile?.display_name ?? "Someone",
      });
      trackEvent("feed_like", { listing_id: item.id, liked: next });
    } catch (err) {
      setLiked(!next);
      setLikes((n) => Math.max(0, n + (next ? -1 : 1)));
      toast.error(err instanceof Error ? err.message : "Could not update like");
    }
  };

  const onDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 320) {
      if (!liked) void handleLike();
      triggerLikeHaptic();
      setShowLikeBurst(true);
      setTimeout(() => setShowLikeBurst(false), 700);
    }
    lastTap.current = now;
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("Sign in to save");
      return;
    }
    const next = !saved;
    setSaved(next);
    if (isDemoListing) {
      toast.success(next ? "Saved (demo)" : "Removed");
      return;
    }
    try {
      await toggleBookmark(item.id, user.id, next);
      trackEvent("feed_save", { listing_id: item.id, saved: next });
      toast.success(next ? "Saved" : "Removed");
    } catch (err) {
      setSaved(!next);
      toast.error(err instanceof Error ? err.message : "Could not update save");
    }
  };

  const handleAddComment = async () => {
    if (!user?.id) {
      toast.error("Sign in to comment");
      return;
    }
    const text = commentText.trim();
    if (!text) return;
    if (isDemoListing) {
      setComments((c) => [
        {
          id: `demo-${Date.now()}`,
          user_id: user.id,
          author: profile?.display_name ?? "You",
          content: text,
          created_at: new Date().toISOString(),
        },
        ...c,
      ]);
      setCommentText("");
      return;
    }
    try {
      await addComment(item.id, user.id, text, {
        sellerId: item.seller_id,
        listingTitle: item.title,
        actorName: profile?.display_name ?? "You",
      });
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
      trackEvent("feed_comment", { listing_id: item.id });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not post comment");
    }
  };

  const handleAddToCart = async () => {
    if (soldOut) {
      toast.error("This produce is sold out");
      return;
    }
    if (!user?.id) {
      toast.error("Sign in to add to cart");
      return;
    }
    if (!isValidUserId(user.id)) {
      toast.error("Sign in with your account to use the cart");
      return;
    }
    if (isDemoListing) {
      toast.info("Demo listing", {
        description: "Browse real farmers or post produce to shop live listings.",
      });
      return;
    }
    try {
      await addToCartMut.mutateAsync({ userId: user.id, listingId: item.id, quantity: 1 });
      trackEvent("feed_add_to_cart", { listing_id: item.id, price: item.price_per_unit });
      toast.success("Added to cart", {
        description: item.title,
        action: {
          label: "View cart",
          onClick: () => navigate({ to: "/app/buyer/cart" }),
        },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add to cart");
    }
  };

  const shareListing = async () => {
    const url = `${location.origin}/market?listing=${item.id}`;
    try {
      if (navigator.share) await navigator.share({ title: item.title, url });
      else await navigator.clipboard.writeText(url);
      trackEvent("feed_share", { listing_id: item.id });
      toast.success("Link ready");
    } catch {
      toast.error("Share failed");
    }
  };

  const openSellerProfile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!profileHandle) {
      toast.error("Seller profile unavailable");
      return;
    }
    void navigate({ to: "/farmers/$slug", params: { slug: profileHandle } });
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user?.id) {
      toast.error("Sign in to follow");
      return;
    }
    if (!followKey) {
      toast.error("Follow unavailable for this seller");
      return;
    }
    if (isSelf) return;
    const next = !following;
    setFollowing(next);
    try {
      await toggleFollow(user.id, followKey, next, profile?.display_name ?? undefined);
      toast.success(next ? "Following" : "Unfollowed");
      trackEvent("feed_follow", { seller_slug: followKey, following: next });
    } catch (err) {
      setFollowing(!next);
      toast.error(err instanceof Error ? err.message : "Could not update follow");
    }
  };

  const soldOut = Number(item.quantity) <= 0 || item.status === "sold_out";

  return (
    <div className="feed-pass-through absolute inset-0">
      <div
        className="feed-touch-target absolute inset-x-0 bottom-44 top-28 right-16 z-[1] sm:right-20 sm:bottom-48"
        onClick={onDoubleTap}
        aria-hidden
      />
      {showImageOnly && (
        <img
          src={item.image_url ?? "/media/demo/tomato.svg"}
          alt={item.title}
          className={`feed-pass-through pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ${isActive ? "scale-105" : "scale-100"}`}
        />
      )}
      {showLikeBurst && (
        <div className="feed-pass-through pointer-events-none absolute inset-0 z-30 grid place-items-center">
          <Heart className="h-24 w-24 animate-ping fill-rose-500 text-rose-500 opacity-90" />
        </div>
      )}
      <div className="scrim-top-dark feed-pass-through" />
      <div className="scrim-bottom-dark feed-pass-through" />

      <div className="feed-touch-target absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pl-14 pt-[max(env(safe-area-inset-top),12px)]">
        <button
          onClick={onOpenGrid}
          className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition active:scale-95"
          aria-label="Browse all"
        >
          <Grid2x2 className="h-4 w-4" />
        </button>
        <span className="text-[10px] uppercase tracking-widest text-white/70">{progress}</span>
        <button
          onClick={onToggleMute}
          className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition active:scale-95"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>

      <div className="feed-touch-target absolute bottom-[calc(10.5rem+env(safe-area-inset-bottom))] right-[4.25rem] z-20 flex flex-col items-center gap-4 sm:right-[4.75rem] sm:gap-5 md:bottom-[calc(11rem+env(safe-area-inset-bottom))]">
        <div className="relative">
          <button
            type="button"
            onClick={openSellerProfile}
            className="feed-touch-target block"
            aria-label={`View ${item.seller_name ?? "seller"} profile`}
          >
            <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-full border-2 border-white bg-primary/30 font-sans text-lg font-semibold text-white sm:h-12 sm:w-12">
              {item.seller_avatar ? (
                <img src={item.seller_avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                (item.seller_name?.[0] ?? "?")
              )}
            </span>
          </button>
          {!isSelf && followKey && (
            <button
              type="button"
              onClick={handleFollow}
              className={`feed-touch-target absolute -bottom-1 left-1/2 grid h-5 w-5 -translate-x-1/2 place-items-center rounded-full border-2 border-white text-[10px] font-bold shadow ${
                following ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
              }`}
              aria-label={following ? "Unfollow" : "Follow"}
            >
              {following ? <UserCheck className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
            </button>
          )}
        </div>
        <Action
          icon={Heart}
          label={formatCount(likes)}
          active={liked}
          activeClass="text-rose-500 fill-rose-500"
          onClick={handleLike}
        />
        <Action
          icon={MessageCircle}
          label={formatCount(isDemoListing ? comments.length : item.comment_count)}
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

      <div className="feed-touch-target absolute inset-x-0 bottom-0 z-20 px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pr-[4.25rem] text-white sm:px-5 sm:pr-24 md:p-6 md:pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        {profileHandle ? (
          <button
            type="button"
            onClick={openSellerProfile}
            className="feed-touch-target inline-flex items-center gap-1.5 text-sm font-medium text-white hover:underline"
          >
            @{sellerHandle}{" "}
            {item.seller_verified && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-white">
            @{sellerHandle}{" "}
            {item.seller_verified && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
          </span>
        )}
        <h2 className="mt-1.5 font-sans text-xl font-bold leading-tight text-white sm:mt-2 sm:text-2xl md:text-3xl">
          {item.title}
        </h2>
        <p className="mt-1 line-clamp-2 max-w-[85%] text-xs text-white/85 sm:max-w-[80%] sm:text-sm">
          {item.location_name} · {soldOut ? "Sold out" : `${item.quantity}${item.unit} available`} · {hoursAgo}h ago
          {item.distance_km != null && ` · ${item.distance_km.toFixed(1)} km`}
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:mt-4 sm:flex-row sm:items-center sm:gap-3">
          <div className="inline-flex w-fit rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">
            <span className="font-sans text-lg font-bold text-white sm:text-xl">GHS {item.price_per_unit}</span>
            <span className="ml-1 text-xs text-white/70">/{item.unit}</span>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={addToCartMut.isPending || soldOut}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60 sm:flex-1"
          >
            <ShoppingBasket className="h-4 w-4" /> {soldOut ? "Sold out" : "Add to cart"}
          </button>
        </div>
        {isDemoListing && (
          <p className="mt-2 text-[10px] uppercase tracking-wide text-white/50">Sample listing · actions are local preview</p>
        )}
      </div>

      {panel && (
        <div
          className="feed-touch-target absolute inset-0 z-30 flex items-end bg-black/35"
          onClick={() => setPanel(null)}
        >
          <div
            className="max-h-[72%] w-full rounded-t-3xl bg-background text-foreground shadow-2xl animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-muted" />
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="font-sans text-lg font-semibold">{panel === "comments" ? "Comments" : "Share"}</h3>
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
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 font-sans font-semibold text-primary">
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
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex min-w-[52px] flex-col items-center gap-1 text-white"
    >
      <span className="grid h-11 w-11 place-items-center rounded-full bg-white/10 backdrop-blur transition active:scale-90 sm:h-12 sm:w-12">
        <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${active ? activeClass : ""}`} />
      </span>
      <span className="text-[10px] font-medium sm:text-[11px]">{label}</span>
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
