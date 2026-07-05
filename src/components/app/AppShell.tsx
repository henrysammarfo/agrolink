import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  ShoppingBasket, Heart, ClipboardList, Wallet, Settings, Tractor, Sprout, Truck, MapPin,
  ChevronLeft, Bell, Search, Plus, LogOut, Home, User, Inbox, Image as ImageIcon,
  ShieldCheck, AlertTriangle, CreditCard, ListChecks, ArrowLeft,
} from "lucide-react";
import { BrandLogo, BrandMark } from "@/components/brand/Logo";
import { useAuth, type AppRole as AuthRole } from "@/lib/auth";

export type AppRole = AuthRole;

const NAV: Record<AppRole, { to: string; label: string; icon: typeof Wallet }[]> = {
  buyer: [
    { to: "/app/buyer", label: "Overview", icon: Heart },
    { to: "/app/buyer/feed", label: "Feed", icon: Sprout },
    { to: "/app/buyer/orders", label: "Orders", icon: ClipboardList },
    { to: "/app/buyer/cart", label: "Cart", icon: ShoppingBasket },
    { to: "/app/inbox", label: "Inbox", icon: Inbox },
  ],
  farmer: [
    { to: "/app/farmer", label: "Studio", icon: Sprout },
    { to: "/app/farmer/listings", label: "Listings", icon: ImageIcon },
    { to: "/app/farmer/orders", label: "Orders", icon: Tractor },
    { to: "/app/farmer/payouts", label: "Payouts", icon: Wallet },
    { to: "/app/inbox", label: "Inbox", icon: Inbox },
  ],
  transport: [
    { to: "/app/transport", label: "Map", icon: MapPin },
    { to: "/app/transport/jobs", label: "Jobs", icon: Truck },
    { to: "/app/inbox", label: "Inbox", icon: Inbox },
  ],
  admin: [
    { to: "/app/admin", label: "Overview", icon: ShieldCheck },
    { to: "/app/admin/payments", label: "Payments", icon: CreditCard },
    { to: "/app/admin/disputes", label: "Disputes", icon: AlertTriangle },
    { to: "/app/admin/listings", label: "Listings", icon: ListChecks },
  ],
};

const IMMERSIVE_PATHS = ["/app/buyer/feed"];

export function AppShell({ role, children }: { role: AppRole; children?: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { profile, roles, signOut } = useAuth();
  const nav = NAV[role];
  const immersive = IMMERSIVE_PATHS.some((p) => pathname === p);

  const mobileTabs = [
    { to: roleHome(role), icon: Home, label: "Home" },
    { to: role === "transport" ? "/app/transport/jobs" : role === "admin" ? "/app/admin/disputes" : "/app/buyer/feed", icon: Sprout, label: "Discover" },
    { to: "/app/create", icon: Plus, label: "", center: true },
    { to: "/app/inbox", icon: Inbox, label: "Inbox" },
    { to: "/app/profile", icon: User, label: "Me" },
  ];

  if (immersive) {
    return (
      <div className="relative h-[100dvh] w-full overflow-hidden bg-black">
        {children ?? <Outlet />}
        <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-white/10 bg-black/80 backdrop-blur-xl pb-[max(env(safe-area-inset-bottom),0px)]">
          {mobileTabs.map((t) => {
            const active = pathname === t.to;
            if (t.center) {
              return (
                <Link key="create" to={t.to} className="flex items-center justify-center -mt-3">
                  <span className="grid h-12 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30">
                    <Plus className="h-5 w-5" />
                  </span>
                </Link>
              );
            }
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] ${active ? "text-white" : "text-white/45"}`}
              >
                <t.icon className={`h-5 w-5 ${active ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : ""}`} />
                {t.label}
              </Link>
            );
          })}
        </nav>
        <Link
          to={roleHome(role)}
          className="fixed left-3 top-[max(env(safe-area-inset-top),12px)] z-50 grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10"
          aria-label="Back to home"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside
        className={`hidden md:flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-500 ${
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

        {!collapsed && roles.length > 1 && (
          <div className="px-3 pb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            Switch surface
          </div>
        )}
        {roles.length > 1 && (
          <div className="px-3">
            <div className={`grid gap-1 ${collapsed ? "" : "grid-cols-2"}`}>
              {roles.map((r) => (
                <Link
                  key={r}
                  to={roleHome(r)}
                  className={`rounded-lg px-2 py-1.5 text-center text-[11px] capitalize ${
                    role === r ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  {collapsed ? r[0].toUpperCase() : r === "farmer" ? "Farmer" : r === "admin" ? "Admin" : r}
                </Link>
              ))}
            </div>
          </div>
        )}

        <nav className="mt-4 flex-1 space-y-1 px-3">
          {nav.map((n) => {
            const active = pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  active ? "bg-primary/15 text-foreground" : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-foreground"
                }`}
              >
                <n.icon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : ""}`} />
                {!collapsed && <span className="truncate">{n.label}</span>}
              </Link>
            );
          })}
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

          <div className="hidden md:flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground w-80 max-w-full">
            <Search className="h-4 w-4" />
            <input
              placeholder={`Search ${role === "buyer" ? "produce, farmers" : role === "farmer" ? "orders, buyers" : role === "admin" ? "users, payments, disputes" : "jobs"}`}
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground/70 text-foreground"
            />
            <kbd className="rounded border border-border px-1.5 text-[10px]">⌘K</kbd>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/app/inbox" className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" />
            </Link>
            {role === "farmer" && (
              <Link to="/app/create" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4" /> New listing
              </Link>
            )}
            <Link to="/app/profile" className="hidden sm:flex items-center gap-3 rounded-full border border-border px-2 py-1.5">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/20 font-serif text-sm text-primary">
                {(profile?.display_name?.[0] ?? "A").toUpperCase()}
              </span>
              <span className="pr-2 text-xs text-muted-foreground capitalize">{role}</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-10 pb-24 md:pb-10">{children ?? <Outlet />}</main>

        <nav className="md:hidden fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-background/95 backdrop-blur pb-[max(env(safe-area-inset-bottom),0px)]">
          {mobileTabs.map((t) => {
            const active = pathname === t.to;
            if (t.center) {
              return (
                <Link key="create" to={t.to} className="flex items-center justify-center -mt-3">
                  <span className="grid h-12 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg">
                    <Plus className="h-5 w-5" />
                  </span>
                </Link>
              );
            }
            return (
              <Link key={t.to} to={t.to} className={`flex flex-col items-center gap-1 py-2.5 text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`}>
                <t.icon className="h-5 w-5" />
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function roleHome(r: AppRole) {
  return (r === "farmer" ? "/app/farmer" : r === "transport" ? "/app/transport" : r === "admin" ? "/app/admin" : "/app/buyer") as "/app/buyer";
}

export function PageHeader({ eyebrow, title, italic, sub, action }: {
  eyebrow?: string; title: string; italic?: string; sub?: string; action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <span className="text-xs uppercase tracking-widest text-primary/80">{eyebrow}</span>}
        <h1 className="mt-2 font-serif text-4xl md:text-5xl text-foreground">
          {title} {italic && <span className="italic text-accent">{italic}</span>}
        </h1>
        {sub && <p className="mt-2 text-sm text-muted-foreground">{sub}</p>}
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
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-2 font-serif text-3xl md:text-4xl ${toneClass}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
