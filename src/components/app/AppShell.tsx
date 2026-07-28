import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState, type CSSProperties, type ReactNode } from "react";
import {
  ShoppingBasket, ClipboardList, Wallet, Settings, Sprout, Truck, MapPin,
  ChevronLeft, Bell, Plus, LogOut, Home, User, Inbox,
  ShieldCheck, AlertTriangle, CreditCard, ListChecks, Search, Radio,
} from "lucide-react";
import { BrandLogo, BrandMark } from "@/components/brand/Logo";
import { useAuth, type AppRole as AuthRole } from "@/lib/auth";
import { useUnreadCounts, useCart } from "@/hooks/use-marketplace";
import { GlobalSearch, SearchTrigger } from "@/components/app/GlobalSearch";
import { roleHome, normalizeWorkspace } from "@/lib/active-workspace";
import { useWorkspaceSwitch } from "@/hooks/use-workspace-switch";
import { useTheme } from "@/components/theme/ThemeProvider";

export type AppRole = AuthRole;

const MARKET_NAV: { to: string; label: string; icon: typeof Wallet; search?: Record<string, string> }[] = [
  { to: "/app/buyer/feed", label: "For You", icon: Sprout },
  { to: "/app/buyer/cart", label: "Cart", icon: ShoppingBasket },
  { to: "/app/buyer/orders", label: "Orders", icon: ClipboardList },
  { to: "/app/inbox", label: "Messages", icon: Inbox, search: { tab: "messages" } },
  { to: "/app/profile", label: "Profile", icon: User },
];

const NAV: Record<AppRole, { to: string; label: string; icon: typeof Wallet; search?: Record<string, string> }[]> = {
  buyer: MARKET_NAV,
  farmer: MARKET_NAV,
  transport: [
    { to: "/app/buyer/feed", label: "For You", icon: Sprout },
    { to: "/app/transport", label: "Map", icon: MapPin },
    { to: "/app/transport/jobs", label: "Jobs", icon: Truck },
    { to: "/app/inbox", label: "Messages", icon: Inbox, search: { tab: "messages" } },
    { to: "/app/profile", label: "Profile", icon: User },
  ],
  admin: [
    { to: "/app/admin", label: "Overview", icon: ShieldCheck },
    { to: "/app/buyer/feed", label: "For You", icon: Sprout },
    { to: "/app/admin/orders", label: "Orders", icon: ClipboardList },
    { to: "/app/admin/payments", label: "Payments", icon: CreditCard },
    { to: "/app/admin/disputes", label: "Disputes", icon: AlertTriangle },
    { to: "/app/admin/listings", label: "Listings", icon: ListChecks },
    { to: "/app/admin/drivers", label: "Drivers", icon: Truck },
  ],
};

const IMMERSIVE_PATHS = ["/app/buyer/feed", "/app/transport"];

function roleLabel(role: AppRole): string {
  if (role === "buyer" || role === "farmer") return "Market";
  if (role === "transport") return "Drive";
  if (role === "admin") return "Admin";
  return role;
}

type MobileTab = {
  id: string;
  to: string;
  icon: typeof Home;
  label: string;
  badge?: number;
  center?: boolean;
  search?: Record<string, string>;
};

function buildMobileTabs(role: AppRole, cartCount: number): MobileTab[] {
  if (role === "buyer" || role === "farmer") {
    return [
      { id: "feed", to: "/app/buyer/feed", icon: Sprout, label: "For You" },
      { id: "cart", to: "/app/buyer/cart", icon: ShoppingBasket, label: "Cart", badge: cartCount },
      { id: "create", to: "/app/create", icon: Plus, label: "", center: true },
      { id: "orders", to: "/app/buyer/orders", icon: ClipboardList, label: "Orders" },
      { id: "me", to: "/app/profile", icon: User, label: "Me" },
    ];
  }
  if (role === "transport") {
    return [
      { id: "feed", to: "/app/buyer/feed", icon: Sprout, label: "Shop" },
      { id: "inbox", to: "/app/inbox", icon: Inbox, label: "Msgs", search: { tab: "messages" } },
      { id: "live", to: "/app/transport", icon: Radio, label: "Live", center: true },
      { id: "jobs", to: "/app/transport/jobs", icon: Truck, label: "Jobs" },
      { id: "me", to: "/app/profile", icon: User, label: "Me" },
    ];
  }
  return [
    { id: "home", to: "/app/admin", icon: Home, label: "Home" },
    { id: "feed", to: "/app/buyer/feed", icon: Sprout, label: "Market" },
    { id: "orders", to: "/app/admin/orders", icon: ClipboardList, label: "Orders", center: true },
    { id: "disputes", to: "/app/admin/disputes", icon: AlertTriangle, label: "Disputes" },
    { id: "me", to: "/app/profile", icon: User, label: "Me" },
  ];
}

/** Longest-prefix match so /jobs doesn't also light Map/Home. */
function isPathActive(pathname: string, to: string, candidates: string[]): boolean {
  const matches = candidates.filter(
    (t) => pathname === t || pathname.startsWith(`${t}/`),
  );
  if (!matches.length) return false;
  const best = matches.reduce((a, b) => (a.length >= b.length ? a : b));
  return best === to;
}

function isMobileTabActive(pathname: string, tab: MobileTab, tabs: MobileTab[]): boolean {
  if (tab.center && tab.id === "create") return pathname.startsWith("/app/create");
  if (tab.center && tab.id === "live") {
    return pathname === "/app/transport" || pathname === "/app/transport/";
  }
  if (tab.center && tab.id === "orders") {
    return pathname.startsWith("/app/admin/orders");
  }
  const siblingTos = tabs.map((t) => t.to);
  return isPathActive(pathname, tab.to, siblingTos);
}

function isSidebarActive(pathname: string, to: string, navTos: string[]): boolean {
  return isPathActive(pathname, to, navTos);
}

function MobileTabLink({
  tab,
  active,
  immersiveDark,
}: {
  tab: MobileTab;
  active: boolean;
  immersiveDark?: boolean;
}) {
  if (tab.center) {
    const isLive = tab.id === "live";
    return (
      <Link key={tab.id} to={tab.to} search={tab.search as never} className="flex items-center justify-center -mt-3">
        <span
          className={`grid h-12 w-14 place-items-center rounded-2xl shadow-lg ${
            isLive
              ? active
                ? "bg-emerald-500 text-white shadow-emerald-500/40 ring-2 ring-emerald-300"
                : "bg-emerald-500 text-white shadow-emerald-500/40"
              : active
                ? "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-primary/30 ring-2 ring-primary/40"
                : "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-primary/30"
          }`}
        >
          <tab.icon className="h-5 w-5" />
        </span>
      </Link>
    );
  }
  return (
    <Link
      key={tab.id}
      to={tab.to}
      search={tab.search as never}
      className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] ${
        active
          ? immersiveDark
            ? "text-white"
            : "text-primary"
          : immersiveDark
            ? "text-white/45"
            : "text-muted-foreground"
      }`}
    >
      <tab.icon className={`h-5 w-5 ${active && immersiveDark ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : ""}`} />
      {tab.label}
      {(tab.badge ?? 0) > 0 && (
        <span className="absolute right-3 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
          {tab.badge! > 9 ? "9+" : tab.badge}
        </span>
      )}
    </Link>
  );
}

export function AppShell({
  role,
  children,
  unreadInbox: unreadOverride,
  hideMobileNav,
  compact,
}: {
  role: AppRole;
  children?: ReactNode;
  unreadInbox?: number;
  /** Hide bottom tab bar (checkout, fullscreen flows) */
  hideMobileNav?: boolean;
  /** Tighter mobile padding */
  compact?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { profile, roles, signOut, user } = useAuth();
  const { data: unread } = useUnreadCounts(user?.id);
  const { data: cartItems = [] } = useCart(user?.id);
  const cartCount = cartItems.reduce((sum, item) => sum + Number(item.quantity), 0);
  const unreadInbox =
    unreadOverride ?? (unread ? unread.notifications + unread.messages : 0);
  const nav = NAV[role === "farmer" ? "buyer" : role];
  const navTos = nav.map((n) => n.to);
  const immersive = IMMERSIVE_PATHS.some((p) => pathname === p);

  const workspaceRoles = [
    ...(roles.includes("buyer") || roles.includes("farmer") ? (["buyer"] as AppRole[]) : []),
    ...(roles.includes("transport") ? (["transport"] as AppRole[]) : []),
    ...(roles.includes("admin") ? (["admin"] as AppRole[]) : []),
  ];

  const { switchTo: switchWorkspace } = useWorkspaceSwitch();
  const { theme } = useTheme();

  const mobileTabs = buildMobileTabs(role, cartCount);

  if (immersive) {
    const lightChrome = pathname.startsWith("/app/transport");
    const feedDark = !lightChrome && theme === "dark";
    const hideDesktopNav = !lightChrome;
    return (
      <div
        className={`agrolink-immersive-feed relative h-[100dvh] w-full overflow-hidden ${hideDesktopNav ? "lg:[--agrolink-tab-bar:0px]" : ""} ${lightChrome ? "bg-background" : feedDark ? "bg-black" : "bg-background"}`}
        style={{ "--agrolink-tab-bar": "3.5rem" } as CSSProperties}
      >
        <div className="absolute inset-0">{children ?? <Outlet />}</div>
        <nav className={`agrolink-immersive-chrome pointer-events-auto fixed inset-x-0 bottom-0 z-[10060] grid grid-cols-5 border-t pb-[max(env(safe-area-inset-bottom),0px)] ${hideDesktopNav ? "lg:hidden" : ""} ${
          lightChrome
            ? "border-border bg-background/95 backdrop-blur-md"
            : feedDark
              ? "border-white/5 bg-black/55 backdrop-blur-md"
              : "border-border bg-background/95 backdrop-blur-md"
        }`}>
          {mobileTabs.map((t) => (
            <MobileTabLink
              key={t.id}
              tab={t}
              active={isMobileTabActive(pathname, t, mobileTabs)}
              immersiveDark={!lightChrome && feedDark}
            />
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside
        className={`sticky top-0 hidden h-dvh shrink-0 self-start overflow-y-auto md:flex flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-500 ${
          collapsed ? "w-[72px]" : "w-[260px]"
        }`}
      >
        <div className="flex items-center justify-between p-5">
          {collapsed ? <BrandMark className="h-8 w-8" /> : <BrandLogo size="sm" />}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        {!collapsed && workspaceRoles.length > 1 && (
          <div className="px-3 pb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            Switch dashboard
          </div>
        )}
        {workspaceRoles.length > 1 && (
          <div className="px-3">
            <div className={`grid gap-1 ${collapsed ? "" : "grid-cols-3"}`}>
              {workspaceRoles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => switchWorkspace(r)}
                  className={`rounded-lg px-2 py-1.5 text-center text-[11px] capitalize ${
                    normalizeWorkspace(role) === r
                      ? "bg-primary/15 text-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  {collapsed ? r[0].toUpperCase() : r === "buyer" ? "Market" : r === "admin" ? "Admin" : "Drive"}
                </button>
              ))}
            </div>
          </div>
        )}

        <nav className="mt-4 flex-1 space-y-1 px-3">
          {nav.map((n) => {
            const active = isSidebarActive(pathname, n.to, navTos);
            return (
              <Link
                key={n.to + (n.search?.tab ?? "")}
                to={n.to}
                search={n.search as never}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  active ? "bg-primary/15 text-foreground" : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-foreground"
                }`}
              >
                <n.icon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : ""}`} />
                {!collapsed && <span className="truncate">{n.label}</span>}
              </Link>
            );
          })}
          {roles.includes("farmer") && (role === "buyer" || role === "farmer") && !collapsed && (
            <Link
              to="/app/farmer"
              className="mt-2 flex items-center gap-3 rounded-xl border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground"
            >
              <Sprout className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">Open Studio</span>
            </Link>
          )}
        </nav>

        <div className="space-y-1 border-t border-sidebar-border p-3">
          {roles.includes("admin") && role !== "admin" && (
            <Link to="/app/admin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-amber-700 dark:text-amber-300 hover:bg-sidebar-accent">
              <ShieldCheck className="h-4 w-4" />
              {!collapsed && "Admin panel"}
            </Link>
          )}
          <Link to="/app/profile" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-foreground">
            <User className="h-4 w-4" />
            {!collapsed && (profile?.display_name || "Profile")}
          </Link>
          <Link to="/app/settings" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-foreground">
            <Settings className="h-4 w-4" />
            {!collapsed && "Settings"}
          </Link>
          <button onClick={() => signOut()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-foreground">
            <LogOut className="h-4 w-4" />
            {!collapsed && "Sign out"}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border bg-background/85 px-5 py-3.5 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <div className="flex items-center gap-3 md:hidden">
            <BrandMark className="h-7 w-7" />
            <span className="font-serif text-lg">AgroLink</span>
          </div>

          <SearchTrigger onClick={() => setSearchOpen(true)} />
          <GlobalSearch role={role} open={searchOpen} onOpenChange={setSearchOpen} />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="md:hidden grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
            <Link
              to="/app/inbox"
              search={{ tab: "activity" }}
              className="relative grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground"
              aria-label="Activity"
              title="Activity"
            >
              <Bell className="h-4 w-4" />
              {unreadInbox > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-primary-foreground">
                  {unreadInbox > 9 ? "9+" : unreadInbox}
                </span>
              )}
            </Link>
            {roles.includes("farmer") && (role === "buyer" || role === "farmer") && (
              <Link to="/app/create" className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:px-4">
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New listing</span>
              </Link>
            )}
            <Link to="/app/profile" className="hidden sm:flex items-center gap-3 rounded-full border border-border px-2 py-1.5">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/20 font-serif text-sm text-primary">
                {(profile?.display_name?.[0] ?? "A").toUpperCase()}
              </span>
              <span className="pr-2 text-xs text-muted-foreground">{roleLabel(role)}</span>
            </Link>
          </div>
        </header>

        <main
          className={`flex-1 w-full min-w-0 overflow-x-hidden ${
            compact ? "px-4 py-4 md:px-8 md:py-8" : "px-4 py-5 sm:px-6 md:p-10"
          } ${hideMobileNav ? "pb-6 md:pb-10" : "pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-10"}`}
        >
          {children ?? <Outlet />}
        </main>

        {!hideMobileNav && (
        <nav className="md:hidden fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-background/95 backdrop-blur pb-[max(env(safe-area-inset-bottom),0px)]">
          {mobileTabs.map((t) => (
            <MobileTabLink key={t.id} tab={t} active={isMobileTabActive(pathname, t, mobileTabs)} />
          ))}
        </nav>
        )}
      </div>
    </div>
  );
}

export { roleHome };

export function PageHeader({ eyebrow, title, italic, sub, action }: {
  eyebrow?: string; title: string; italic?: string; sub?: string; action?: ReactNode;
}) {
  return (
    <header className="mb-[var(--space-section)] flex flex-col gap-[var(--space-block)] md:mb-12 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <span className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {eyebrow}
          </span>
        )}
        <h1 className="mt-[var(--space-tight)] font-serif text-[2rem] leading-[1.15] tracking-tight text-foreground sm:text-4xl md:text-[2.75rem]">
          {title} {italic && <span className="italic text-primary/90">{italic}</span>}
        </h1>
        {sub && (
          <p className="mt-[var(--space-tight)] max-w-xl text-sm leading-relaxed text-muted-foreground md:text-[15px]">
            {sub}
          </p>
        )}
      </div>
      {action}
    </header>
  );
}

export function StatCard({ label, value, sub, tone = "primary" }: {
  label: string; value: string; sub?: string; tone?: "primary" | "accent" | "muted" | "amber" | "rose" | "emerald";
}) {
  const toneClass =
    tone === "primary" ? "text-primary"
    : tone === "accent" ? "text-accent"
    : tone === "amber" ? "text-amber-600 dark:text-amber-400"
    : tone === "rose" ? "text-rose-600 dark:text-rose-400"
    : tone === "emerald" ? "text-emerald-600 dark:text-emerald-400"
    : "text-foreground";
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-border/80 bg-card p-5 sm:p-6">
      <div className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">{label}</div>
      <div className={`mt-3 truncate font-serif text-2xl tabular-nums sm:text-3xl ${toneClass}`}>{value}</div>
      {sub && <div className="mt-2 text-xs leading-snug text-muted-foreground">{sub}</div>}
    </div>
  );
}
