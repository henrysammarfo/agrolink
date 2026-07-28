import { Link, useRouterState } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronLeft,
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
import { useState } from "react";
import { BrandLogo, BrandMark } from "@/components/brand/Logo";
import { useAuthGate } from "@/components/auth/auth-gate";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useAuth } from "@/lib/auth";
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
  { to: "/app/profile", label: "Profile", icon: User, match: (p: string) => p.startsWith("/app/profile") || p.startsWith("/app/users") },
] as const;

/**
 * TikTok desktop chrome: left rail + centered 9:16 stage + up/down.
 * Respects Settings light/dark theme on chrome; video stage stays black.
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
  const { theme } = useTheme();
  const { roles } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const nav = chrome === "public" ? PUBLIC_NAV : APP_NAV;
  const dark = theme === "dark";

  const shellClass = dark ? "bg-black text-white" : "bg-background text-foreground";
  const railClass = dark
    ? "border-white/10 bg-black"
    : "border-border bg-sidebar text-sidebar-foreground";
  const navActive = dark ? "bg-white/10 text-primary" : "bg-primary/15 text-foreground";
  const navIdle = dark ? "text-white/85 hover:bg-white/5" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-foreground";

  return (
    <div className={cn("relative flex h-full w-full overflow-hidden", shellClass, className)}>
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r px-3 py-4 transition-[width] duration-300 lg:flex lg:sticky lg:top-0 lg:h-full lg:overflow-y-auto",
          collapsed ? "w-[72px]" : "w-[240px] xl:w-[280px]",
          railClass,
        )}
      >
        <div className={cn("flex items-center justify-between px-2 pb-4", collapsed && "justify-center")}>
          {collapsed ? (
            <BrandMark className="h-8 w-8" />
          ) : (
            <BrandLogo size="sm" className={dark ? "[&_span]:!text-white" : undefined} />
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-lg transition",
              dark ? "text-white/60 hover:bg-white/10" : "text-muted-foreground hover:bg-sidebar-accent",
              collapsed && "hidden",
            )}
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className={cn(
              "mx-auto mb-3 grid h-8 w-8 place-items-center rounded-lg",
              dark ? "text-white/60 hover:bg-white/10" : "text-muted-foreground hover:bg-sidebar-accent",
            )}
            aria-label="Expand sidebar"
          >
            <ChevronLeft className="h-4 w-4 rotate-180" />
          </button>
        )}

        {!collapsed && chrome === "public" && (
          <div className="mb-3 px-1">
            <Link
              to="/farmers"
              className={cn(
                "flex h-11 items-center gap-3 rounded-full px-4 text-sm transition",
                dark ? "bg-white/10 text-white/70 hover:bg-white/15" : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
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
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-semibold transition",
                  collapsed && "justify-center px-2",
                  active ? navActive : navIdle,
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", active && "text-primary")} />
                {!collapsed && item.label}
              </Link>
            );
          })}
          {!collapsed && chrome === "app" && roles.includes("farmer") && (
            <Link
              to="/app/farmer"
              className={cn(
                "mt-1 flex items-center gap-3 rounded-lg border border-dashed px-3 py-2.5 text-sm transition",
                dark
                  ? "border-white/20 text-white/70 hover:border-primary/40 hover:text-white"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              <Sprout className="h-5 w-5 shrink-0 text-primary" />
              Studio
            </Link>
          )}
        </nav>

        {!collapsed && (
          <>
            {!isSignedIn ? (
              <button
                type="button"
                onClick={() => openAuthGate("Log in to shop fresh produce.")}
                className="mt-3 w-full rounded-md bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:brightness-110"
              >
                Log in
              </button>
            ) : chrome === "app" ? null : (
              <Link
                to="/app/buyer/feed"
                className="mt-3 w-full rounded-md bg-primary py-2.5 text-center text-sm font-bold text-primary-foreground hover:brightness-110"
              >
                Open app
              </Link>
            )}
            <p className={cn("mt-4 px-2 text-[10px] leading-relaxed", dark ? "text-white/35" : "text-muted-foreground")}>
              © {new Date().getFullYear()} AgroLink · Farm to city
            </p>
          </>
        )}
      </aside>

      <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center">
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
            "lg:h-[min(100dvh,100%)] lg:w-[min(420px,56.25dvh)] lg:max-w-[420px] lg:shadow-[0_0_40px_rgba(0,0,0,0.55)]",
          )}
        >
          {children}
        </div>

        {total > 1 && (
          <div className="absolute right-3 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-3 lg:flex xl:right-8">
            <button
              type="button"
              aria-label="Previous listing"
              disabled={activeIndex <= 0}
              onClick={onPrev}
              className={cn(
                "grid h-12 w-12 place-items-center rounded-full transition disabled:opacity-30",
                dark ? "bg-white/10 text-white hover:bg-white/20" : "bg-muted text-foreground hover:bg-muted/80",
              )}
            >
              <ChevronUp className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="Next listing"
              disabled={activeIndex >= total - 1}
              onClick={onNext}
              className={cn(
                "grid h-12 w-12 place-items-center rounded-full transition disabled:opacity-30",
                dark ? "bg-white/10 text-white hover:bg-white/20" : "bg-muted text-foreground hover:bg-muted/80",
              )}
            >
              <ChevronDown className="h-6 w-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
