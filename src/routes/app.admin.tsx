import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CreditCard,
  ListChecks,
  ArrowRight,
  Loader2,
  Truck,
} from "lucide-react";
import { PageHeader, StatCard } from "@/components/app/AppShell";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { fetchAdminStats } from "@/lib/api/notifications";
import { supabase } from "@/integrations/supabase/client";
import { apiFetch } from "@/lib/api/fetch-auth";

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
            <section className="mt-12 grid gap-6 lg:grid-cols-3">
              <AdminCard
                to="/app/admin/listings"
                icon={ListChecks}
                tone="accent"
                title="Listings"
                count={stats.pendingReview}
                sub="Pending moderation"
              />
              <AdminCard
                to="/app/admin/payments"
                icon={CreditCard}
                tone="emerald"
                title="Payments"
                count={stats.orderCount}
                sub="All transactions"
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
                to="/app/admin/drivers"
                icon={Truck}
                tone="emerald"
                title="Drivers"
                count={stats.pendingDrivers}
                sub="Pending verification"
              />
            </section>
            <button
              onClick={async () => {
                await apiFetch("/api/moderate", {
                  method: "POST",
                  body: JSON.stringify({ action: "ingest_prices" }),
                });
                const pending = await supabase
                  .from("listings")
                  .select("id")
                  .eq("status", "pending_review");
                for (const l of pending.data ?? []) {
                  await apiFetch("/api/moderate", {
                    method: "POST",
                    body: JSON.stringify({ action: "moderate", title: "review", listingId: l.id }),
                  });
                }
              }}
              className="mt-8 text-sm text-primary underline-offset-4 hover:underline"
            >
              Run AI price ingest + review pending listings
            </button>
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
      className="group flex items-center justify-between rounded-3xl border border-border bg-card p-6 hover:border-primary/40 transition"
    >
      <div className="flex items-center gap-4">
        <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-muted ${toneCls}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <div className="font-serif text-xl">{title}</div>
          <div className="text-xs text-muted-foreground">{sub}</div>
        </div>
      </div>
      <div className="text-right">
        <div className={`font-serif text-3xl ${toneCls}`}>{count}</div>
        <ArrowRight className="mt-2 h-4 w-4 text-muted-foreground group-hover:text-foreground" />
      </div>
    </Link>
  );
}
