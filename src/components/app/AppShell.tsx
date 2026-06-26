import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  ShoppingBasket, Heart, ClipboardList, Wallet, Settings, Tractor, Sprout, Truck, MapPin,
  ChevronLeft, Bell, Search, Plus, LogOut,
} from "lucide-react";
import { BrandLogo, BrandMark } from "@/components/brand/Logo";

export type AppRole = "buyer" | "farmer" | "transport";

const NAV: Record<AppRole, { to: string; label: string; icon: typeof Wallet }[]> = {
  buyer: [
    { to: "/app/buyer", label: "Overview", icon: Heart },
    { to: "/app/buyer/feed", label: "Feed", icon: Sprout },
    { to: "/app/buyer/orders", label: "Orders", icon: ClipboardList },
    { to: "/app/buyer/cart", label: "Cart", icon: ShoppingBasket },
  ],
  farmer: [
    { to: "/app/farmer", label: "Overview", icon: Sprout },
    { to: "/app/farmer/listings", label: "Listings", icon: ClipboardList },
    { to: "/app/farmer/orders", label: "Orders", icon: Tractor },
    { to: "/app/farmer/payouts", label: "Payouts", icon: Wallet },
  ],
  transport: [
    { to: "/app/transport", label: "Overview", icon: Truck },
    { to: "/app/transport/jobs", label: "Job board", icon: MapPin },
  ],
};

const ROLE_LABEL: Record<AppRole, string> = {
  buyer: "Buyer",
  farmer: "Farmer",
  transport: "Transport partner",
};

export function AppShell({ role, children }: { role: AppRole; children?: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const nav = NAV[role];

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

        <div className="px-3">
          <RoleSwitcher role={role} collapsed={collapsed} />
        </div>

        <nav className="mt-4 flex-1 space-y-1 px-3">
          {nav.map((n) => {
            const active = pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-primary/15 text-foreground"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-foreground"
                }`}
              >
                <n.icon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : ""}`} />
                {!collapsed && <span className="truncate">{n.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-sidebar-border p-3">
          <Link
            to="/app/settings"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
            {!collapsed && "Settings"}
          </Link>
          <Link
            to="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && "Exit dashboard"}
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border bg-background/85 px-5 py-3.5 backdrop-blur">
          <div className="flex items-center gap-3 md:hidden">
            <BrandMark className="h-7 w-7" />
            <span className="font-serif text-lg">AgroLink</span>
          </div>

          <div className="hidden md:flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground w-80 max-w-full">
            <Search className="h-4 w-4" />
            <input
              placeholder={`Search ${role === "buyer" ? "produce, farmers" : role === "farmer" ? "orders, buyers" : "jobs"}`}
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground/70 text-foreground"
            />
            <kbd className="rounded border border-border px-1.5 text-[10px]">⌘K</kbd>
          </div>

          <div className="flex items-center gap-3">
            <button className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </button>
            {role === "farmer" && (
              <button className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4" /> New listing
              </button>
            )}
            <div className="hidden sm:flex items-center gap-3 rounded-full border border-border px-2 py-1.5">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/20 font-serif text-sm text-primary">A</span>
              <span className="pr-2 text-xs text-muted-foreground">{ROLE_LABEL[role]}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-10">{children ?? <Outlet />}</main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden sticky bottom-0 z-30 grid grid-cols-4 border-t border-border bg-background/95 backdrop-blur">
          {nav.slice(0, 4).map((n) => {
            const active = pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex flex-col items-center gap-1 py-2.5 text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function RoleSwitcher({ role, collapsed }: { role: AppRole; collapsed: boolean }) {
  if (collapsed) {
    return (
      <div className="grid place-items-center rounded-xl bg-sidebar-accent py-2 text-xs text-muted-foreground">
        {role[0].toUpperCase()}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-xl bg-sidebar-accent p-1">
      {(["buyer", "farmer", "transport"] as AppRole[]).map((r) => (
        <Link
          key={r}
          to={`/app/${r}` as "/app/buyer"}
          className={`flex-1 rounded-lg px-2 py-1.5 text-center text-[11px] capitalize transition ${
            role === r ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {r}
        </Link>
      ))}
    </div>
  );
}

export function PageHeader({ eyebrow, title, italic, sub, action }: {
  eyebrow?: string;
  title: string;
  italic?: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <span className="text-xs uppercase tracking-widest text-muted-foreground">{eyebrow}</span>}
        <h1 className="mt-2 font-serif text-4xl md:text-5xl text-foreground">
          {title} {italic && <span className="italic">{italic}</span>}
        </h1>
        {sub && <p className="mt-2 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </header>
  );
}

export function StatCard({ label, value, sub, tone = "primary" }: {
  label: string; value: string; sub?: string; tone?: "primary" | "accent" | "muted";
}) {
  const toneClass = tone === "primary" ? "text-primary" : tone === "accent" ? "text-accent" : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-2 font-serif text-3xl md:text-4xl ${toneClass}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
