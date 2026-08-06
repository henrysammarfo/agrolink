import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CreditCard,
  ListChecks,
  ClipboardList,
  ArrowRight,
  Loader2,
  Truck,
  Zap,
} from "lucide-react";
import { PageHeader, StatCard } from "@/components/app/AppShell";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { fetchAdminStats } from "@/lib/api/notifications";

export const Route = createFileRoute("/app/admin")({
  head: () => ({ meta: [{ title: "Admin · AgroLink" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/app/admin") {
    return (
      <AdminPageLayout>
        <Outlet />
      </AdminPageLayout>
    );
  }
  return <AdminOverview />;
}

function AdminOverview() {
  const [stats, setStats] = useState({
    gmv: 0,
    orderCount: 0,
    activeListings: 0,
    pendingReview: 0,
    pendingDrivers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminPageLayout>
        <PageHeader
          eyebrow="Operations"
          title="Admin"
          italic="control room"
          sub="Disputes, payments, driver applications, and listing reports across the platform."
        />
        {loading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="GMV"
                value={`GHS ${stats.gmv.toLocaleString()}`}
                sub="Paid orders"
                tone="emerald"
              />
              <StatCard
                label="Orders"
                value={String(stats.orderCount)}
                sub="All time"
                tone="primary"
              />
              <StatCard
                label="Active listings"
                value={String(stats.activeListings)}
                sub="In feed"
                tone="amber"
              />
              <StatCard
                label="Pending review"
                value={String(stats.pendingReview)}
                sub="Needs moderation"
                tone="rose"
              />
            </div>
            <section className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <AdminCard
                to="/app/admin/drivers"
                icon={Truck}
                tone="emerald"
                title="Drivers"
                count={stats.pendingDrivers}
                sub="KYC approve — human gate"
              />
              <AdminCard
                to="/app/admin/listings"
                icon={ListChecks}
                tone="accent"
                title="Listings"
                count={stats.pendingReview}
                sub="Reports & pending review"
              />
              <AdminCard
                to="/app/admin/orders"
                icon={ClipboardList}
                tone="accent"
                title="Orders"
                count={stats.orderCount}
                sub="Audit trail"
              />
              <AdminCard
                to="/app/admin/payments"
                icon={CreditCard}
                tone="emerald"
                title="Payments"
                count={stats.orderCount}
                sub="Disputes & refunds — not daily release"
              />
              <AdminCard
                to="/app/admin/disputes"
                icon={AlertTriangle}
                tone="rose"
                title="Disputes"
                count={0}
                sub="Open cases"
              />
              <AdminCard
                to="/app/admin/pricing"
                icon={Zap}
                tone="accent"
                title="Surge pricing"
                count={0}
                sub="Peak / rain multiplier"
              />
            </section>
            <p className="mt-10 max-w-xl text-xs leading-relaxed text-muted-foreground">
              Happy path is automatic: moderate → live listing; MoMo pay → match driver; POD → MoMo
              splits. Admin stays for KYC, disputes, and refunds.
            </p>
          </>
        )}
    </AdminPageLayout>
  );
}

function AdminCard({
  to,
  icon: Icon,
  tone,
  title,
  count,
  sub,
}: {
  to: string;
  icon: typeof ShieldCheck;
  tone: "rose" | "emerald" | "accent";
  title: string;
  count: number;
  sub: string;
}) {
  const toneCls =
    tone === "rose" ? "text-rose-500" : tone === "emerald" ? "text-emerald-600" : "text-accent";
  return (
    <Link
      to={to}
      className="group flex items-center justify-between gap-4 rounded-3xl border border-border/80 bg-card p-7 transition hover:border-primary/35"
    >
      <div className="flex min-w-0 items-center gap-5">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-muted ${toneCls}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="font-serif text-xl tracking-tight">{title}</div>
          <div className="mt-1 text-xs leading-snug text-muted-foreground">{sub}</div>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className={`font-serif text-3xl tabular-nums ${toneCls}`}>{count}</div>
        <ArrowRight className="mt-2 ml-auto h-4 w-4 text-muted-foreground transition group-hover:text-foreground" />
      </div>
    </Link>
  );
}
