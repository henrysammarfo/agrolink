import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ShieldCheck, AlertTriangle, CreditCard, ListChecks, ArrowRight } from "lucide-react";
import { AppShell, PageHeader, StatCard } from "@/components/app/AppShell";
import { AdminGate } from "@/components/app/RoleGate";
import { adminPayments, disputes, listingReports } from "@/lib/mock-data";

export const Route = createFileRoute("/app/admin")({
  head: () => ({ meta: [{ title: "Admin · AgroLink" }] }),
  component: AdminOverview,
});

function AdminOverview() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/app/admin") return <Outlet />;

  const openDisputes = disputes.filter((d) => d.status === "open" || d.status === "investigating").length;
  const heldPayments = adminPayments.filter((p) => p.status === "held").length;
  const pendingReports = listingReports.filter((r) => r.status === "pending").length;
  const gmv = adminPayments.filter((p) => p.status === "captured").reduce((s, p) => s + p.amountGhs, 0);

  return (
    <AdminGate>
      <AppShell role="admin">
        <PageHeader
          eyebrow="Operations"
          title="Admin"
          italic="control room"
          sub="Disputes, payments, and listing reports across the platform."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="GMV today" value={`GHS ${gmv.toLocaleString()}`} sub="Captured payments" tone="emerald" />
          <StatCard label="Open disputes" value={String(openDisputes)} sub="Needs human review" tone="rose" />
          <StatCard label="Payments on hold" value={String(heldPayments)} sub="Auto-release in 24h" tone="amber" />
          <StatCard label="Listing reports" value={String(pendingReports)} sub="Pending moderation" tone="accent" />
        </div>

        <section className="mt-12 grid gap-6 lg:grid-cols-3">
          <AdminCard
            to="/app/admin/disputes"
            icon={AlertTriangle}
            tone="rose"
            title="Disputes"
            count={openDisputes}
            sub="Open & investigating"
          />
          <AdminCard
            to="/app/admin/payments"
            icon={CreditCard}
            tone="emerald"
            title="Payments"
            count={adminPayments.length}
            sub="Last 24h"
          />
          <AdminCard
            to="/app/admin/listings"
            icon={ListChecks}
            tone="accent"
            title="Listings"
            count={pendingReports}
            sub="Pending reports"
          />
        </section>
      </AppShell>
    </AdminGate>
  );
}

function AdminCard({ to, icon: Icon, tone, title, count, sub }: {
  to: string; icon: typeof ShieldCheck; tone: "rose" | "emerald" | "accent"; title: string; count: number; sub: string;
}) {
  const toneClass =
    tone === "rose" ? "bg-rose-500/15 text-rose-600"
    : tone === "emerald" ? "bg-emerald-500/15 text-emerald-600"
    : "bg-accent/20 text-accent";
  return (
    <Link to={to} className="group rounded-3xl border border-border bg-card p-6 transition hover:border-primary/40">
      <div className={`inline-grid h-11 w-11 place-items-center rounded-2xl ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="font-serif text-3xl text-foreground">{count}</div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{sub}</div>
        </div>
        <span className="inline-flex items-center gap-1 text-sm text-primary group-hover:translate-x-0.5 transition-transform">
          {title} <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
