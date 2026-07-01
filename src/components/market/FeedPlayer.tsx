import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Heart, MessageCircle, Share2, Bookmark, ShoppingBasket, MapPin, BadgeCheck,
  Volume2, VolumeX, Music2, Grid2x2, X, Send, Copy, MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { listings, type FeedComment, type Listing } from "@/lib/mock-data";

type Props = {
  initialIndex?: number;
  /** When true, the feed fills the viewport (mobile-app feel). When false, it sits in a phone-frame inside a section. */
  fullscreen?: boolean;
};

export function FeedPlayer({ initialIndex = 0, fullscreen = true }: Props) {
  const rankedListings = useMemo(() => [...listings].sort((a, b) => feedScore(b) - feedScore(a)), []);
  const [active, setActive] = useState(initialIndex);
  const [muted, setMuted] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // IntersectionObserver-based active tracking on scroll-snap
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            const idx = Number((e.target as HTMLElement).dataset.idx);
            if (!Number.isNaN(idx)) setActive(idx);
          }
        });
      },
      { root, threshold: [0.6, 0.9] },
    );
    itemRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Scroll to initial index once
  useEffect(() => {
    const el = itemRefs.current[initialIndex];
    el?.scrollIntoView({ behavior: "auto", block: "start" });
  }, [initialIndex]);

  // Keyboard arrows
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") scrollToIdx(Math.min(active + 1, rankedListings.length - 1));
      else if (e.key === "ArrowUp") scrollToIdx(Math.max(active - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, rankedListings.length]);

  function scrollToIdx(i: number) {
    itemRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const wrapperClass = fullscreen
    ? "fixed inset-0 z-0 bg-black"
    : "relative mx-auto aspect-[9/16] w-full max-w-[420px] overflow-hidden rounded-[2rem] border border-border bg-black shadow-[var(--shadow-cinema)]";

  return (
    <div className={wrapperClass}>
      <div
        ref={containerRef}
        className="no-scrollbar h-full w-full overflow-y-auto snap-y snap-mandatory"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {rankedListings.map((l, i) => (
          <div
            key={l.id}
            ref={(el) => { itemRefs.current[i] = el; }}
            data-idx={i}
            className="relative h-full w-full snap-start snap-always"
            style={{ minHeight: "100%" }}
          >
            <FeedCard
              item={l}
              isActive={i === active}
              muted={muted}
              onToggleMute={() => setMuted((m) => !m)}
              onOpenGrid={() => setShowGrid(true)}
              progress={`${i + 1} / ${rankedListings.length}`}
            />
          </div>
        ))}
      </div>

      {/* progress rail */}
      <div className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 flex-col gap-1.5 md:flex">
        {rankedListings.map((_, i) => (
          <span
            key={i}
            className={`block h-6 w-1 rounded-full transition-all ${i === active ? "bg-white" : "bg-white/30"}`}
          />
        ))}
      </div>

      {/* grid drawer */}
      {showGrid && (
        <div className="absolute inset-0 z-30 bg-background/95 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="font-serif text-2xl">Browse all</h3>
            <button onClick={() => setShowGrid(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 overflow-y-auto p-3 md:grid-cols-3 lg:grid-cols-4" style={{ maxHeight: "calc(100% - 60px)" }}>
            {rankedListings.map((l, i) => (
              <button
                key={l.id}
                onClick={() => { setShowGrid(false); scrollToIdx(i); }}
                className="relative aspect-[9/16] overflow-hidden rounded-2xl"
              >
                <img src={l.image} alt={l.produce} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-left">
                  <div className="font-serif text-sm text-white">{l.produce}</div>
                  <div className="text-[10px] text-white/70">GHS {l.pricePerKg}/kg</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FeedCard({
  item, isActive, muted, onToggleMute, onOpenGrid, progress,
}: {
  item: Listing;
  isActive: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onOpenGrid: () => void;
  progress: string;
}) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(item.likes ?? 120);
  const [comments, setComments] = useState<FeedComment[]>(item.comments ?? []);
  const [commentText, setCommentText] = useState("");
  const [panel, setPanel] = useState<"comments" | "share" | null>(null);

  const addComment = () => {
    const text = commentText.trim();
    if (!text) return;
    setComments((curr) => [{ id: `local-${Date.now()}`, author: "You", text, at: "now" }, ...curr]);
    setCommentText("");
    toast.success("Comment posted", { description: item.produce });
  };

  const shareListing = async () => {
    const url = `${location.origin}/market?listing=${item.id}`;
    try {
      if (navigator.share) await navigator.share({ title: `${item.produce} on AgroLink`, text: `${item.produce} from ${item.farmer}`, url });
      else await navigator.clipboard.writeText(url);
      toast.success("Share link ready", { description: item.produce });
    } catch {
      toast.error("Share failed", { description: "Try copying the link instead." });
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <img
        src={item.image}
        alt={item.produce}
        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ${isActive ? "scale-105" : "scale-100"}`}
      />
      {/* dual gradient for legibility — keep image bright in the middle */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/55 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      {/* top bar */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)]">
        <button onClick={onOpenGrid} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 backdrop-blur text-white" aria-label="Browse all">
          <Grid2x2 className="h-4 w-4" />
        </button>
        <span className="text-[10px] uppercase tracking-widest text-white/70">{progress}</span>
        <button onClick={onToggleMute} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 backdrop-blur text-white" aria-label={muted ? "Unmute" : "Mute"}>
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>

      {/* right action rail */}
      <div className="absolute right-3 bottom-28 z-10 flex flex-col items-center gap-5 md:bottom-32">
        <Link to="/farmers/$slug" params={{ slug: item.farmerSlug }} className="relative">
          <span className="grid h-12 w-12 place-items-center rounded-full border-2 border-white bg-primary/30 font-serif text-lg text-white">
            {item.farmer.split(" ").map((p) => p[0]).join("").slice(0, 2)}
          </span>
          <span className="absolute -bottom-1 left-1/2 grid h-5 w-5 -translate-x-1/2 place-items-center rounded-full bg-destructive text-[11px] font-bold text-white">+</span>
        </Link>
        <Action
          icon={Heart}
          label={formatCount(likes)}
          active={liked}
          activeClass="text-rose-500 fill-rose-500"
          onClick={() => { setLiked((v) => !v); setLikes((n) => n + (liked ? -1 : 1)); }}
        />
        <Action icon={MessageCircle} label={formatCount(comments.length)} onClick={() => setPanel("comments")} />
        <Action icon={Bookmark} label="Save" active={saved} activeClass="text-amber-sun fill-amber-sun" onClick={() => setSaved((v) => !v)} />
        <Action icon={Share2} label="Share" onClick={() => setPanel("share")} />
      </div>

      {/* bottom meta */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-4 pb-[max(env(safe-area-inset-bottom),16px)] pr-20 text-white md:p-6 md:pr-24">
        <Link to="/farmers/$slug" params={{ slug: item.farmerSlug }} className="inline-flex items-center gap-1.5 text-sm font-medium text-white hover:underline">
          @{item.farmerSlug.replace("-", "")} <BadgeCheck className="h-3.5 w-3.5 text-primary" />
        </Link>
        <h2 className="mt-2 font-serif text-3xl leading-tight text-white md:text-4xl">{item.produce}</h2>
        <p className="mt-1 max-w-[80%] text-sm text-white/85">
          Fresh from {item.location} · {item.quantityKg}kg available · posted {item.postedHoursAgo}h ago
          {item.organic && " · #organic"}
          {item.trending && " · #trending"}
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-white/70">
          <Music2 className="h-3.5 w-3.5" />
          <span className="truncate">Original sound · {item.farmer}</span>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">
            <span className="font-serif text-xl text-white">GHS {item.pricePerKg}</span>
            <span className="ml-1 text-xs text-white/70">/kg</span>
          </div>
          <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:brightness-110">
            <ShoppingBasket className="h-4 w-4" /> Add to cart
          </button>
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-white/65">
          <MapPin className="h-3 w-3" /> {item.location}, Greater Accra
        </div>
      </div>

      {panel && (
        <div className="absolute inset-0 z-20 flex items-end bg-black/35" onClick={() => setPanel(null)}>
          <div className="max-h-[72%] w-full rounded-t-3xl bg-background text-foreground shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h3 className="font-serif text-xl">{panel === "comments" ? "Comments" : "Share listing"}</h3>
                <p className="text-xs text-muted-foreground">{item.produce} · {item.farmer}</p>
              </div>
              <button onClick={() => setPanel(null)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary" aria-label="Close panel">
                <X className="h-4 w-4" />
              </button>
            </div>

            {panel === "comments" ? (
              <div className="flex max-h-[calc(72vh-72px)] flex-col">
                <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-4">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 font-serif text-primary">{c.author[0]}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-xs"><span className="font-medium">{c.author}</span><span className="text-muted-foreground">{c.at}</span></div>
                        <p className="mt-1 text-sm text-foreground/85">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 border-t border-border p-3">
                  <input value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addComment()} placeholder="Add a comment…" className="min-w-0 flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary" />
                  <button onClick={addComment} disabled={!commentText.trim()} className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-45" aria-label="Post comment">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 p-4 sm:grid-cols-3">
                <button onClick={shareListing} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left hover:border-primary/40">
                  <Share2 className="h-5 w-5 text-primary" /> <span className="text-sm font-medium">System share</span>
                </button>
                <button onClick={() => { navigator.clipboard?.writeText(`${location.origin}/market?listing=${item.id}`); toast.success("Link copied"); }} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left hover:border-primary/40">
                  <Copy className="h-5 w-5 text-accent" /> <span className="text-sm font-medium">Copy link</span>
                </button>
                <Link to="/app/inbox" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left hover:border-primary/40">
                  <MessageSquare className="h-5 w-5 text-emerald-600" /> <span className="text-sm font-medium">Send in DM</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Action({
  icon: Icon, label, onClick, active, activeClass,
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

function feedScore(item: Listing) {
  const freshness = Math.max(0, 48 - item.postedHoursAgo) * 3;
  const engagement = (item.likes ?? 0) * 0.7 + (item.comments?.length ?? 0) * 25 + (item.views ?? 0) * 0.02;
  const trust = item.organic ? 35 : 0;
  const trend = item.trending ? 90 : 0;
  return freshness + engagement + trust + trend;
}
