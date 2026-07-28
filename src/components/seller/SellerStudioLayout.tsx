import { Link, useRouterState } from "@tanstack/react-router";
import { useMemo, type ReactNode } from "react";
import {
  BarChart3,
  ClipboardList,
  Home,
  Image as ImageIcon,
  Inbox,
  Plus,
  Sprout,
  User,
  Wallet,
} from "lucide-react";
import { BrandMark } from "@/components/brand/Logo";
import { FarmerGate } from "@/components/app/RoleGate";
import { useAuth } from "@/lib/auth";
import { useSellerOrders } from "@/hooks/use-marketplace";
import { orderNeedsFarmerAction } from "@/lib/farmer-order-flow";
import { cn } from "@/lib/utils";

const RAIL: ReadonlyArray<{
  to: "/app/create" | "/app/farmer" | "/app/farmer/listings" | "/app/farmer/orders" | "/app/farmer/payouts" | "/app/inbox";
  label: string;
  icon: typeof Plus;
  accent?: boolean;
  exact?: boolean;
  badgeKey?: "sales";
  search?: { tab: "messages" | "activity" | "requests" };
}> = [
  { to: "/app/create", label: "Create", icon: Plus, accent: true },
  { to: "/app/farmer", label: "Home", icon: Home, exact: true },
  { to: "/app/farmer/listings", label: "Posts", icon: ImageIcon },
  { to: "/app/farmer/orders", label: "Sales", icon: ClipboardList, badgeKey: "sales" },
  { to: "/app/farmer/payouts", label: "Money", icon: Wallet },
  { to: "/app/inbox", label: "Messages", icon: Inbox, search: { tab: "messages" } },
];

/**
 * TikTok Studio–style seller chrome: narrow icon rail + spacious main.
 * Maps Studio jobs to AgroLink (posts=listings, money=payouts, sales=orders).
 */
export function SellerStudioLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const { data: orders = [] } = useSellerOrders(user?.id);
  const salesBadge = useMemo(
    () => orders.filter(orderNeedsFarmerAction).length,
    [orders],
  );

  return (
    <FarmerGate>
      <div className="flex min-h-screen bg-background text-foreground">
        <aside className="sticky top-0 z-30 hidden h-screen w-[72px] shrink-0 flex-col items-center border-r border-border bg-card/80 py-4 backdrop-blur-sm md:flex">
          <Link to="/app/buyer/feed" className="mb-5 grid h-10 w-10 place-items-center" aria-label="AgroLink">
            <BrandMark className="h-8 w-8" />
          </Link>
          <nav className="flex flex-1 flex-col items-center gap-1.5">
            {RAIL.map((item) => {
              const active = item.exact
                ? pathname === item.to
                : pathname === item.to || pathname.startsWith(`${item.to}/`);
              const Icon = item.icon;
              const badge = item.badgeKey === "sales" ? salesBadge : 0;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  search={item.search as never}
                  title={item.label}
                  aria-label={badge > 0 ? `${item.label}, ${badge} need action` : item.label}
                  className={cn(
                    "relative grid h-11 w-11 place-items-center rounded-2xl transition",
                    item.accent
                      ? "bg-primary text-primary-foreground shadow-sm hover:brightness-110"
                      : active
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {badge > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-primary-foreground">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <Link
            to="/app/profile"
            title="Profile"
            className="mt-auto grid h-11 w-11 place-items-center rounded-2xl text-muted-foreground hover:bg-secondary/80"
          >
            <User className="h-5 w-5" />
          </Link>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 pb-24 md:px-10 md:pb-10">
            {children}
          </main>

          <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-background/95 pb-[max(env(safe-area-inset-bottom),0px)] backdrop-blur md:hidden">
            {[
              { to: "/app/buyer/feed" as const, icon: Sprout, label: "Shop", exact: false },
              { to: "/app/farmer/listings" as const, icon: ImageIcon, label: "Posts", exact: false },
              { to: "/app/create" as const, icon: Plus, label: "Create", center: true, exact: false },
              { to: "/app/farmer/orders" as const, icon: BarChart3, label: "Sales", exact: false, badge: salesBadge },
              { to: "/app/farmer/payouts" as const, icon: Wallet, label: "Money", exact: false },
            ].map((t) => {
              const active = t.center
                ? pathname.startsWith("/app/create")
                : t.to === "/app/buyer/feed"
                  ? pathname.startsWith("/app/buyer/feed")
                  : pathname === t.to || pathname.startsWith(`${t.to}/`);
              const Icon = t.icon;
              if (t.center) {
                return (
                  <Link
                    key={t.to}
                    to={t.to}
                    className="grid place-items-center py-2"
                    aria-label={t.label}
                  >
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-md">
                      <Icon className="h-5 w-5" />
                    </span>
                  </Link>
                );
              }
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={cn(
                    "relative flex flex-col items-center gap-0.5 py-2 text-[10px]",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {t.label}
                  {(t.badge ?? 0) > 0 && (
                    <span className="absolute right-3 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                      {t.badge! > 9 ? "9+" : t.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </FarmerGate>
  );
}
