import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo, forwardRef, useImperativeHandle } from "react";
import { createPortal } from "react-dom";
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
import { isSeedListingId } from "@/lib/demo-listings";
import { isValidUserId } from "@/lib/api/cart";
import { getCurrentPosition } from "@/lib/native-geolocation";
import { triggerLikeHaptic } from "@/lib/haptics";
import { FeedSkeleton } from "@/components/feed/FeedSkeleton";
import { CategoryChips, filterByCategory } from "@/components/feed/CategoryChips";

export { FEED_ALGORITHM_COPY };

type Props = {
  initialIndex?: number;
  fullscreen?: boolean;
  /** In-app buyer feed with bottom tab bar overlay (TikTok-style) */
  inAppFeed?: boolean;
  /** Jump to a specific listing in the feed */
  listingId?: string;
};

export function FeedPlayer({ initialIndex = 0, fullscreen = true, inAppFeed = false, listingId }: Props) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | undefined>();
  const { data, isLoading, error, refetch, isFetching } = useFeed(coords?.lat, coords?.lng);
  const rankedListings = data?.listings ?? [];
  const [active, setActive] = useState(initialIndex);
  const [muted, setMuted] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [category, setCategory] = useState("all");
  const feedRef = useRef<{ scrollToItem: (i: number, behavior?: ScrollBehavior) => void }>(null);

  const filteredListings = useMemo(
    () => filterByCategory(rankedListings, category),
    [rankedListings, category],
  );
  const categoryFilteredEmpty = rankedListings.length > 0 && filteredListings.length === 0;

  useEffect(() => {
    void getCurrentPosition().then((p) => {
      if (p) setCoords({ lat: p.lat, lng: p.lng });
    });
    trackEvent("feed_view");
  }, []);

  useEffect(() => {
    if (!listingId || !filteredListings.length) return;
    const idx = filteredListings.findIndex((l) => l.id === listingId);
    if (idx >= 0) {
      setActive(idx);
      feedRef.current?.scrollToItem(idx, "auto");
    }
  }, [listingId, filteredListings]);

  useEffect(() => {
    if (filteredListings.length) {
      feedRef.current?.scrollToItem(initialIndex, "auto");
    }
  }, [initialIndex, filteredListings.length]);

  const wrapperClass = fullscreen
    ? `h-full w-full bg-black${inAppFeed ? " agrolink-tiktok-feed" : ""}`
    : "relative mx-auto aspect-[9/16] w-full max-w-[420px] overflow-hidden rounded-[2rem] border border-border bg-black shadow-[var(--shadow-cinema)]";

  if (isLoading) {
    return (
      <div className={wrapperClass}>
        <FeedSkeleton />
      </div>
    );
  }

  if (error && rankedListings.length === 0) {
    return (
      <div className={`${wrapperClass} grid place-items-center p-8 text-center`}>
        <p className="text-white font-sans text-2xl font-semibold">Couldn&apos;t load feed</p>
        <p className="mt-2 text-sm text-white/70">
          {error instanceof Error ? error.message : "Check your connection and try again."}
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {isFetching ? "Retrying…" : "Retry"}
        </button>
      </div>
    );
  }

  if (rankedListings.length === 0) {
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

  if (categoryFilteredEmpty) {
    return (
      <div className={wrapperClass}>
        <div className="relative flex h-full flex-col items-center justify-center p-8 text-center">
          {inAppFeed && (
            <div className="absolute inset-x-0 top-0 z-10 pt-[max(env(safe-area-inset-top),6px)]">
              <CategoryChips active={category} onChange={setCategory} inAppFeed />
            </div>
          )}
          <p className="text-white font-sans text-xl font-semibold">No listings in this category</p>
          <p className="mt-2 text-sm text-white/70">Try another filter or browse all produce.</p>
          <button
            type="button"
            onClick={() => setCategory("all")}
            className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
          >
            Show all
          </button>
        </div>
      </div>
    );
  }

  const gridOverlay = showGrid ? (
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
              setActive(i);
              feedRef.current?.scrollToItem(i, "smooth");
            }}
            className="relative aspect-[9/16] overflow-hidden rounded-2xl"
          >
            <img
              src={l.image_url ?? "/media/demo/tomato.jpg"}
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
  ) : null;

  return (
    <div className={wrapperClass}>
      <ProduceSnapFeed
        ref={feedRef}
        listings={filteredListings}
        active={active}
        onActiveChange={setActive}
        inAppFeed={inAppFeed}
        muted={muted}
        onToggleMute={() => setMuted((m) => !m)}
        onOpenGrid={() => setShowGrid(true)}
        category={category}
        onCategoryChange={setCategory}
      />
      <div className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 flex-col gap-1.5 md:flex z-20">
        {filteredListings.map((_, i) => (
          <span
            key={i}
            className={`block h-6 w-1 rounded-full transition-all ${i === active ? "bg-white" : "bg-white/30"}`}
          />
        ))}
      </div>
      {gridOverlay}
    </div>
  );
}

type ProduceSnapFeedProps = {
  listings: FeedListing[];
  active: number;
  onActiveChange: (i: number) => void;
  inAppFeed: boolean;
  muted: boolean;
  onToggleMute: (e: React.MouseEvent) => void;
  onOpenGrid: () => void;
  category: string;
  onCategoryChange: (c: string) => void;
};

const ProduceSnapFeed = forwardRef<{ scrollToItem: (i: number, behavior?: ScrollBehavior) => void }, ProduceSnapFeedProps>(
  function ProduceSnapFeed(
    { listings, active, onActiveChange, inAppFeed, muted, onToggleMute, onOpenGrid, category, onCategoryChange },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

    useImperativeHandle(ref, () => ({
      scrollToItem: (index, behavior = "smooth") => {
        const el = containerRef.current?.querySelector(`[data-feed-index="${index}"]`);
        el?.scrollIntoView({ behavior, block: "start" });
      },
    }));

    useEffect(() => {
      const root = containerRef.current;
      if (!root) return;
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const idx = Number(entry.target.getAttribute("data-feed-index"));
              if (!Number.isNaN(idx)) onActiveChange(idx);
            }
          }
        },
        { threshold: 0.6, root },
      );
      root.querySelectorAll("[data-feed-index]").forEach((el) => observer.observe(el));
      return () => observer.disconnect();
    }, [listings.length, onActiveChange]);

    useEffect(() => {
      videoRefs.current.length = listings.length;
    }, [listings.length]);

    // Sync mute + play/pause for video listings
    useEffect(() => {
      videoRefs.current.forEach((video, idx) => {
        if (!video) return;
        video.muted = muted;
        if (idx === active) {
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, [active, muted, listings]);

    const handleToggleMute = (e: React.MouseEvent) => {
      e.stopPropagation();
      const nextMuted = !muted;
      onToggleMute();
      const video = videoRefs.current[active];
      if (video) {
        video.muted = nextMuted;
        if (!nextMuted) void video.play().catch(() => {});
      }
    };

    return (
      <div
        ref={containerRef}
        role="feed"
        aria-label="Produce feed"
        className="h-full w-full overflow-y-auto snap-y snap-mandatory overscroll-y-contain"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {listings.map((listing, i) => {
          const isVideo = !!listing.video_url;
          return (
            <div
              key={listing.id}
              data-feed-index={i}
              className="relative h-[100dvh] min-h-[100dvh] w-full shrink-0 snap-start snap-always bg-black"
            >
              {isVideo ? (
                <video
                  ref={(el) => {
                    videoRefs.current[i] = el;
                  }}
                  src={listing.video_url!}
                  poster={listing.image_url ?? undefined}
                  className="absolute inset-0 h-full w-full object-cover"
                  playsInline
                  loop
                  muted={muted}
                  preload="metadata"
                />
              ) : (
                <img
                  src={listing.image_url ?? "/media/demo/tomato.jpg"}
                  alt={listing.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading={i <= 2 ? "eager" : "lazy"}
                />
              )}
              <FeedCardOverlay
                item={listing}
                isActive={i === active}
                muted={muted}
                onToggleMute={handleToggleMute}
                onOpenGrid={onOpenGrid}
                progress={`${i + 1} / ${listings.length}`}
                hasVideo={isVideo}
                inAppFeed={inAppFeed}
                category={category}
                onCategoryChange={onCategoryChange}
                showCategories={i === 0}
              />
            </div>
          );
        })}
      </div>
    );
  },
);

function FeedCardOverlay({
  item,
  isActive,
  muted,
  onToggleMute,
  onOpenGrid,
  progress,
  hasVideo = false,
  inAppFeed = false,
  category = "all",
  onCategoryChange,
  showCategories = false,
}: {
  item: FeedListing;
  isActive: boolean;
  muted: boolean;
  onToggleMute: (e: React.MouseEvent) => void;
  onOpenGrid: () => void;
  progress: string;
  hasVideo?: boolean;
  inAppFeed?: boolean;
  category?: string;
  onCategoryChange?: (id: string) => void;
  showCategories?: boolean;
}) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const addToCartMut = useAddToCart();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(item.like_count);
  const [commentCount, setCommentCount] = useState(item.comment_count);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [panel, setPanel] = useState<"comments" | "share" | null>(null);
  const [showLikeBurst, setShowLikeBurst] = useState(false);
  const [following, setFollowing] = useState(false);
  const lastTap = useRef(0);
  const [portalReady, setPortalReady] = useState(false);
  const sellerSlug = item.seller_slug?.trim().toLowerCase() || null;
  const profileHandle = sellerSlug ?? item.seller_id;
  const followKey = sellerSlug ?? item.seller_id ?? "";
  const sellerHandle = (item.seller_slug ?? item.seller_name ?? "seller").replace(/-/g, "").slice(0, 20);
  const isSelf = user?.id === item.seller_id;
  const hoursAgo = Math.round((Date.now() - new Date(item.created_at).getTime()) / 3_600_000);
  const isDemoListing = isSeedListingId(item.id);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!panel) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [panel]);

  useEffect(() => {
    setLikes(item.like_count);
    setCommentCount(item.comment_count);
  }, [item.id, item.like_count, item.comment_count]);

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
    if (isDemoListing) {
      toast.error("This is an offline preview listing");
      return;
    }
    const text = commentText.trim();
    if (!text) return;
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
          author: profile?.display_name ?? "You",
          content: text,
          created_at: new Date().toISOString(),
        },
        ...c,
      ]);
      setCommentCount((n) => n + 1);
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
    const inApp = location.pathname.startsWith("/app");
    void navigate({
      to: inApp ? "/app/users/$slug" : "/farmers/$slug",
      params: { slug: profileHandle },
    });
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
  const tabInset = inAppFeed
    ? "calc(var(--agrolink-tab-bar,3.5rem) + env(safe-area-inset-bottom,0px))"
    : "env(safe-area-inset-bottom,0px)";
  const captionBottom = `calc(${tabInset} + 0.375rem)`;
  const railBottom = `calc(${tabInset} + 4.75rem)`;

  return (
    <div className="agrolink-feed-overlay feed-pass-through absolute inset-0">
      <div
        className="feed-touch-target absolute inset-0 z-[1]"
        style={{
          bottom: tabInset,
          right: "4.25rem",
        }}
        onClick={onDoubleTap}
        aria-hidden
      />
      {showLikeBurst && (
        <div className="feed-pass-through pointer-events-none absolute inset-0 z-30 grid place-items-center">
          <Heart className="h-24 w-24 animate-ping fill-rose-500 text-rose-500 opacity-90" />
        </div>
      )}
      <div className="scrim-top-dark feed-pass-through" />
      <div className="scrim-bottom-dark feed-pass-through" />

      {inAppFeed ? (
        <div className="feed-touch-target absolute inset-x-0 top-0 z-10 pt-[max(env(safe-area-inset-top),6px)]">
          {showCategories && onCategoryChange && (
            <CategoryChips active={category} onChange={onCategoryChange} inAppFeed />
          )}
          <div className="flex items-center justify-end px-3 pb-1">
            {hasVideo && (
              <button
                type="button"
                onClick={(e) => onToggleMute(e)}
                className="grid h-9 w-9 place-items-center rounded-full bg-black/20 text-white backdrop-blur-sm transition active:scale-95"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="feed-touch-target absolute inset-x-0 top-0 z-10 flex items-center justify-between px-3 pt-[max(env(safe-area-inset-top),8px)]">
          <button
            onClick={onOpenGrid}
            className="grid h-10 w-10 place-items-center rounded-full bg-black/25 text-white backdrop-blur-sm transition active:scale-95"
            aria-label="Browse all"
          >
            <Grid2x2 className="h-4 w-4" />
          </button>
          <span className="rounded-full bg-black/25 px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-white/80 backdrop-blur-sm">
            {progress}
          </span>
          {hasVideo ? (
            <button
              type="button"
              onClick={(e) => onToggleMute(e)}
              className="grid h-10 w-10 place-items-center rounded-full bg-black/25 text-white backdrop-blur-sm transition active:scale-95"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          ) : (
            <span className="h-10 w-10" aria-hidden />
          )}
        </div>
      )}

      <div
        className="feed-touch-target absolute right-1.5 z-20 flex flex-col items-center gap-4"
        style={{ bottom: railBottom }}
      >
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
          label={formatCount(commentCount)}
          onClick={() => setPanel("comments")}
        />
        <Action
          icon={Bookmark}
          label="Save"
          active={saved}
          activeClass="text-amber-sun fill-amber-sun"
          onClick={handleSave}
        />
        <Action
          icon={ShoppingBasket}
          label={soldOut ? "Sold" : "Buy"}
          onClick={handleAddToCart}
          disabled={addToCartMut.isPending || soldOut}
        />
        <Action icon={Share2} label="Share" onClick={() => setPanel("share")} />
      </div>

      <div
        className="feed-touch-target absolute inset-x-0 bottom-0 z-20 max-w-[78%] px-3 text-white sm:max-w-[72%] sm:px-4"
        style={{
          paddingBottom: captionBottom,
        }}
      >
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
        <h2 className="mt-1 line-clamp-2 font-sans text-[15px] font-semibold leading-snug text-white">
          {item.title}
          <span className="font-normal text-white/80">
            {" "}· GHS {item.price_per_unit}/{item.unit}
            {soldOut ? " · Sold out" : ""}
          </span>
        </h2>
        <p className="mt-1 line-clamp-1 text-xs text-white/75">
          {item.location_name}
          {item.distance_km != null && ` · ${item.distance_km.toFixed(1)} km`}
          {" · "}{hoursAgo}h ago
        </p>
        {inAppFeed ? (
          <button
            type="button"
            onClick={onOpenGrid}
            className="feed-touch-target mt-2 text-xs font-medium text-white/60 underline-offset-2 hover:text-white hover:underline"
          >
            Browse all produce
          </button>
        ) : (
          <div className="mt-2 flex items-center gap-2">
            <div className="inline-flex rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-sm">
              <span className="font-sans text-base font-bold text-white">GHS {item.price_per_unit}</span>
              <span className="ml-1 text-[11px] text-white/70">/{item.unit}</span>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={addToCartMut.isPending || soldOut}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            >
              <ShoppingBasket className="h-4 w-4" /> {soldOut ? "Sold out" : "Add to cart"}
            </button>
          </div>
        )}
        {isDemoListing && (
          <p className="mt-2 text-[10px] uppercase tracking-wide text-white/50">Offline preview · sign in on live listings to interact</p>
        )}
      </div>

      {panel && portalReady
        ? createPortal(
            <div
              className="fixed inset-0 z-[10080] flex items-end bg-black/40"
              style={{
                paddingBottom: inAppFeed
                  ? "calc(var(--agrolink-tab-bar, 3.5rem) + env(safe-area-inset-bottom, 0px))"
                  : "env(safe-area-inset-bottom, 0px)",
              }}
              onClick={() => setPanel(null)}
              role="presentation"
            >
              <div
                className="flex w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-background text-foreground shadow-2xl animate-in slide-in-from-bottom duration-300 mx-auto"
                style={{ height: "min(70dvh, 520px)" }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={panel === "comments" ? "Comments" : "Share"}
              >
                <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-muted" />
                <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
                  <h3 className="font-sans text-lg font-semibold">{panel === "comments" ? "Comments" : "Share"}</h3>
                  <button
                    type="button"
                    onClick={() => setPanel(null)}
                    className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {panel === "comments" ? (
                  <>
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
                      {comments.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                          No comments yet — be the first.
                        </p>
                      ) : (
                        comments.map((c) => (
                          <div key={c.id} className="flex gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 font-sans font-semibold text-primary">
                              {c.author[0]}
                            </span>
                            <div>
                              <div className="text-xs font-medium">{c.author}</div>
                              <p className="mt-1 text-sm">{c.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="shrink-0 border-t border-border bg-background p-3 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
                      {user?.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAddComment()}
                            placeholder="Add a comment…"
                            aria-label="Add a comment"
                            autoFocus
                            className="min-w-0 flex-1 rounded-full border border-border bg-card px-4 py-3 text-base outline-none focus:border-primary"
                          />
                          <button
                            type="button"
                            onClick={handleAddComment}
                            disabled={!commentText.trim() || isDemoListing}
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-45"
                            aria-label="Post comment"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <p className="py-2 text-center text-sm text-muted-foreground">
                          <Link to="/auth" className="font-medium text-primary hover:underline">
                            Sign in
                          </Link>{" "}
                          to comment
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="grid gap-3 p-4 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={shareListing}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary/40"
                    >
                      <Share2 className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">Share</span>
                    </button>
                    <button
                      type="button"
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
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function Action({
  icon: Icon,
  label,
  onClick,
  active,
  activeClass,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  active?: boolean;
  activeClass?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex min-w-[48px] flex-col items-center gap-0.5 text-white disabled:opacity-45"
    >
      <span className="grid h-11 w-11 place-items-center rounded-full bg-black/25 backdrop-blur-sm transition active:scale-90">
        <Icon className={`h-5 w-5 ${active ? activeClass : ""}`} />
      </span>
      <span className="text-[10px] font-medium drop-shadow-sm">{label}</span>
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
