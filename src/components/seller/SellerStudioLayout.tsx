import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  BarChart3,
  ClipboardList,
  Home,
  Image as ImageIcon,
  Inbox,
  Plus,
  User,
  Wallet,
} from "lucide-react";
import { BrandMark } from "@/components/brand/Logo";
import { FarmerGate } from "@/components/app/RoleGate";
import { cn } from "@/lib/utils";

const RAIL = [
  { to: "/app/create", label: "Create", icon: Plus, accent: true },
  { to: "/app/farmer", label: "Home", icon: Home, exact: true },
  { to: "/app/farmer/listings", label: "Posts", icon: ImageIcon },
  { to: "/app/farmer/orders", label: "Sales", icon: ClipboardList },
  { to: "/app/farmer/payouts", label: "Money", icon: Wallet },
  { to: "/app/inbox", label: "Inbox", icon: Inbox },
] as const;

/**
 * TikTok Studio–style seller chrome: narrow icon rail + spacious main.
 * Maps Studio jobs to AgroLink (posts=listings, money=payouts, sales=orders).
 */
export function SellerStudioLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  aria-label={item.label}
                  className={cn(
                    "grid h-11 w-11 place-items-center rounded-2xl transition",
                    item.accent
                      ? "bg-primary text-primary-foreground shadow-sm hover:brightness-110"
                      : active
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
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
              { to: "/app/farmer", icon: Home, label: "Home" },
              { to: "/app/farmer/listings", icon: ImageIcon, label: "Posts" },
              { to: "/app/create", icon: Plus, label: "Create", center: true },
              { to: "/app/farmer/orders", icon: BarChart3, label: "Sales" },
              { to: "/app/farmer/payouts", icon: Wallet, label: "Money" },
            ].map((t) => {
              const active = pathname === t.to || (t.to !== "/app/farmer" && pathname.startsWith(t.to));
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
                    "flex flex-col items-center gap-0.5 py-2 text-[10px]",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </FarmerGate>
  );
}
