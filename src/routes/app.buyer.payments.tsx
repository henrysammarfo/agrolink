import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, CreditCard, Loader2, ArrowRight } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { StatusBadge } from "./app.buyer";
import { useAuth } from "@/lib/auth";
import { useBuyerOrders } from "@/hooks/use-marketplace";

export const Route = createFileRoute("/app/buyer/payments")({
  head: () => ({ meta: [{ title: "Payments · AgroLink" }] }),
  component: BuyerPayments,
});

const PAYMENT_TONE: Record<string, string> = {
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  failed: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
  refunded: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
};

function BuyerPayments() {
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useBuyerOrders(user?.id);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "paid" | "pending" | "failed" | "refunded">("all");

  const payments = useMemo(
    () =>
      orders.map((o) => ({
        orderId: o.id,
        ref: o.id.slice(0, 8),
        amount: Number(o.total_amount),
        status: o.payment_status ?? "pending",
        orderStatus: o.status,
        label: o.items?.map((i) => i.listing?.title).filter(Boolean).join(" · ") || "Order",
        createdAt: new Date(o.created_at).toLocaleString(),
      })),
    [orders],
  );

  const filtered = useMemo(
    () =>
      payments.filter((p) => {
        if (status !== "all" && p.status !== status) return false;
        if (!q) return true;
        return `${p.ref} ${p.label} ${p.orderId}`.toLowerCase().includes(q.toLowerCase());
      }),
    [payments, q, status],
  );

  const paidTotal = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const pendingTotal = payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);

  return (
    <AppShell role="buyer">
      <PageHeader
        eyebrow="Finance"
        title="Your"
        italic="payments"
        sub="MoMo charges for every order — tap through to track delivery."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Paid total</div>
          <div className="mt-2 font-serif text-3xl text-emerald-600">GHS {paidTotal.toLocaleString()}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Pending</div>
          <div className="mt-2 font-serif text-3xl text-amber-600">GHS {pendingTotal.toLocaleString()}</div>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search ref, listing…"
            className="w-full bg-transparent outline-none"
          />
        </div>
        <div className="flex gap-1 rounded-full border border-border bg-card p-1">
          {(["all", "paid", "pending", "failed", "refunded"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1 text-xs capitalize ${
                status === s ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-5 py-4 text-left">Ref</th>
                <th className="px-5 py-4 text-left">Listing</th>
                <th className="px-5 py-4 text-right">Amount</th>
                <th className="px-5 py-4 text-right">Payment</th>
                <th className="px-5 py-4 text-right">Order</th>
                <th className="px-5 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.orderId} className="hover:bg-background/40">
                  <td className="px-5 py-4">
                    <div className="font-mono text-xs text-primary/80">{p.ref}</div>
                    <div className="text-[10px] text-muted-foreground">{p.createdAt}</div>
                  </td>
                  <td className="px-5 py-4 max-w-[12rem] truncate">{p.label}</td>
                  <td className="px-5 py-4 text-right font-serif text-lg text-primary">GHS {p.amount}</td>
                  <td className="px-5 py-4 text-right">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${PAYMENT_TONE[p.status] ?? PAYMENT_TONE.pending}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <StatusBadge status={p.orderStatus} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      to="/app/buyer/orders/$orderId/track"
                      params={{ orderId: p.orderId }}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Track <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    <CreditCard className="mx-auto mb-2 h-6 w-6 opacity-40" />
                    No payments yet — your MoMo charges appear here after checkout.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
