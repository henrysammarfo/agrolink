import { Link, useRouterState } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Home,
  Inbox,
  Info,
  Search,
  ShoppingBasket,
  Sprout,
  User,
  Users,
} from "lucide-react";
import { BrandLogo, BrandMark } from "@/components/brand/Logo";
import { useAuthGate } from "@/components/auth/auth-gate";
import { cn } from "@/lib/utils";

type Chrome = "public" | "app";

type Props = {
  chrome: Chrome;
  isSignedIn: boolean;
  activeIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  children: React.ReactNode;
  className?: string;
};

const PUBLIC_NAV = [
  { to: "/market", label: "For You", icon: Home, match: (p: string) => p === "/market" },
  { to: "/farmers", label: "Farmers", icon: Users, match: (p: string) => p.startsWith("/farmers") },
  { to: "/how-it-works", label: "How it works", icon: Info, match: (p: string) => p.startsWith("/how") },
] as const;

const APP_NAV = [
  { to: "/app/buyer/feed", label: "For You", icon: Sprout, match: (p: string) => p.startsWith("/app/buyer/feed") },
  { to: "/app/buyer/cart", label: "Cart", icon: ShoppingBasket, match: (p: string) => p.startsWith("/app/buyer/cart") },
  { to: "/app/buyer/orders", label: "Orders", icon: ClipboardList, match: (p: string) => p.startsWith("/app/buyer/orders") },
  { to: "/app/inbox", label: "Inbox", icon: Inbox, match: (p: string) => p.startsWith("/app/inbox") },
  { to: "/app/profile", label: "Profile", icon: User, match: (p: string) => p.startsWith("/app/profile") },
] as const;

/**
 * TikTok desktop chrome: left rail + centered 9:16 stage + up/down.
 * Mobile stays full-bleed (no sidebar).
 */
export function FeedDesktopShell({
  chrome,
  isSignedIn,
  activeIndex,
  total,
  onPrev,
  onNext,
  children,
  className,
}: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { openAuthGate } = useAuthGate();
  const nav = chrome === "public" ? PUBLIC_NAV : APP_NAV;

  return (
    <div className={cn("relative flex h-full w-full overflow-hidden bg-black text-white", className)}>
      {/* Left sidebar — desktop only */}
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-white/10 bg-black px-3 py-4 lg:flex xl:w-[280px]">
        <div className="px-2 pb-4">
          <BrandLogo size="sm" className="[&_span]:!text-white" />
        </div>

        {chrome === "public" && (
          <div className="mb-3 px-1">
            <Link
              to="/farmers"
              className="flex h-11 items-center gap-3 rounded-full bg-white/10 px-4 text-sm text-white/70 transition hover:bg-white/15"
            >
              <Search className="h-4 w-4" />
              Search farms
            </Link>
          </div>
        )}

        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-semibold transition",
                  active ? "bg-white/10 text-primary" : "text-white/85 hover:bg-white/5",
                )}
              >
                <item.icon className={cn("h-5 w-5", active && "text-primary")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {!isSignedIn ? (
          <button
            type="button"
            onClick={() => openAuthGate("Log in to shop fresh produce.")}
            className="mt-3 w-full rounded-md bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:brightness-110"
          >
            Log in
          </button>
        ) : chrome === "app" ? (
          <Link
            to="/app/buyer/feed"
            className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"
          >
            <BrandMark className="h-6 w-6" />
            For You
          </Link>
        ) : (
          <Link
            to="/app/buyer/feed"
            className="mt-3 w-full rounded-md bg-primary py-2.5 text-center text-sm font-bold text-primary-foreground hover:brightness-110"
          >
            Open app
          </Link>
        )}

        <p className="mt-4 px-2 text-[10px] leading-relaxed text-white/35">
          © {new Date().getFullYear()} AgroLink · Farm to city
        </p>
      </aside>

      {/* Stage */}
      <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center">
        {/* Top-right utilities (desktop) */}
        <div className="pointer-events-auto absolute right-4 top-4 z-30 hidden items-center gap-2 lg:flex">
          {!isSignedIn && (
            <button
              type="button"
              onClick={() => openAuthGate()}
              className="rounded-md bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground hover:brightness-110"
            >
              Log in
            </button>
          )}
        </div>

        <div
          className={cn(
            "relative h-full w-full overflow-hidden bg-black",
            // TikTok desktop: phone-width column centered in the black stage
            "lg:h-[min(100dvh,100%)] lg:w-[min(420px,56.25dvh)] lg:max-w-[420px] lg:shadow-[0_0_40px_rgba(0,0,0,0.55)]",
          )}
        >
          {children}
        </div>

        {/* Up / down — desktop */}
        {total > 1 && (
          <div className="absolute right-3 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-3 lg:flex xl:right-8">
            <button
              type="button"
              aria-label="Previous listing"
              disabled={activeIndex <= 0}
              onClick={onPrev}
              className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-30"
            >
              <ChevronUp className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="Next listing"
              disabled={activeIndex >= total - 1}
              onClick={onNext}
              className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-30"
            >
              <ChevronDown className="h-6 w-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
