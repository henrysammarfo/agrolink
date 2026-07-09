import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Filter, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { AdminGate } from "@/components/app/RoleGate";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useAdminPayments } from "@/hooks/use-marketplace";
import { updatePaymentStatus } from "@/lib/api/payouts";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/app/admin/payments")({
  head: () => ({ meta: [{ title: "Payments · Admin · AgroLink" }] }),
  component: AdminPayments,
});

type UiStatus = "captured" | "held" | "refunded" | "failed";

function mapStatus(s: string): UiStatus {
  if (s === "paid") return "captured";
  if (s === "refunded") return "refunded";
  if (s === "failed") return "failed";
  return "held";
}

const TONE: Record<UiStatus, string> = {
  captured: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  held: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  refunded: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  failed: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
};

type Action = { kind: "release" | "refund" | "retry"; paymentId: string; amount: number; ref: string } | null;

function AdminPayments() {
  const { data: rows = [], isLoading } = useAdminPayments();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | UiStatus>("all");
  const [action, setAction] = useState<Action>(null);
  const [note, setNote] = useState("");

  const items = useMemo(
    () =>
      rows.map((p) => ({
        id: p.id,
        ref: p.provider_reference ?? p.idempotency_key ?? p.id.slice(0, 8),
        amountGhs: Number(p.amount),
        uiStatus: mapStatus(p.status),
        dbStatus: p.status,
        buyer: p.order?.buyer_id?.slice(0, 8) ?? "—",
        farmer: p.order?.items?.[0]?.listing?.title ?? "Seller",
        channel: "Paystack MoMo",
        createdAt: new Date(p.created_at).toLocaleString(),
      })),
    [rows],
  );

  const filtered = useMemo(
    () =>
      items.filter((p) => {
        if (status !== "all" && p.uiStatus !== status) return false;
        if (!q) return true;
        return `${p.id} ${p.buyer} ${p.farmer} ${p.ref}`.toLowerCase().includes(q.toLowerCase());
      }),
    [items, q, status],
  );

  const runAction = async () => {
    if (!action) return;
    const statusMap = { release: "paid", refund: "refunded", retry: "paid" } as const;
    try {
      await updatePaymentStatus(action.paymentId, statusMap[action.kind], note);
      await qc.invalidateQueries({ queryKey: ["admin-payments"] });
      toast.success(`Payment ${action.kind}d`, { description: action.ref });
      setNote("");
    } catch (e) {
      toast.error("Action failed", { description: e instanceof Error ? e.message : "Retry" });
      throw e;
    }
  };

  const labels = {
    release: { title: "Release funds to farmer?", confirm: "Release funds", tone: "success" as const,
      desc: action && `Confirm GHS ${action.amount} settlement.` },
    refund: { title: "Refund the buyer?", confirm: "Refund buyer", tone: "danger" as const,
      desc: action && `Return GHS ${action.amount} to buyer.` },
    retry: { title: "Retry this payment?", confirm: "Retry charge", tone: "warning" as const,
      desc: action && `Re-attempt capture for ${action.ref}.` },
  };

  return (
    <AdminGate>
      <AppShell role="admin" compact>
        <PageHeader
          eyebrow="Finance"
          title="All"
          italic="payments"
          sub="Live Paystack payments from Supabase — every action is logged."
          action={
            <button onClick={() => toast.message("Export queued", { description: "CSV from Supabase." })}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-card">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          }
        />

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ref, buyer…" className="w-full bg-transparent outline-none" />
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-card p-1">
            <Filter className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
            {(["all", "captured", "held", "refunded", "failed"] as const).map((s) => (
              <button key={s} onClick={() => setStatus(s)}
                className={`rounded-full px-3 py-1 text-xs capitalize ${status === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-5 py-4 text-left">Ref</th>
                <th className="px-5 py-4 text-left">Buyer</th>
                <th className="px-5 py-4 text-left">Listing</th>
                <th className="px-5 py-4 text-right">Amount</th>
                <th className="px-5 py-4 text-right">Status</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-background/40">
                  <td className="px-5 py-4">
                    <div className="font-mono text-xs text-primary/80">{p.id.slice(0, 8)}</div>
                    <div className="text-[10px] text-muted-foreground">{p.ref}</div>
                  </td>
                  <td className="px-5 py-4">{p.buyer}</td>
                  <td className="px-5 py-4 text-accent">{p.farmer}</td>
                  <td className="px-5 py-4 text-right font-serif text-lg text-primary">GHS {p.amountGhs}</td>
                  <td className="px-5 py-4 text-right">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${TONE[p.uiStatus]}`}>{p.uiStatus}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {p.uiStatus === "held" && (
                      <button onClick={() => setAction({ kind: "release", paymentId: p.id, amount: p.amountGhs, ref: p.ref })} className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs text-white">Release</button>
                    )}
                    {p.uiStatus === "captured" && (
                      <button onClick={() => setAction({ kind: "refund", paymentId: p.id, amount: p.amountGhs, ref: p.ref })} className="rounded-full border border-rose-300 px-3 py-1.5 text-xs text-rose-600">Refund</button>
                    )}
                    {p.uiStatus === "failed" && (
                      <button onClick={() => setAction({ kind: "retry", paymentId: p.id, amount: p.amountGhs, ref: p.ref })} className="rounded-full border border-border px-3 py-1.5 text-xs">Retry</button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">No payments yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        )}

        {action && (
          <ConfirmDialog
            open={!!action}
            onOpenChange={(v) => { if (!v) { setAction(null); setNote(""); } }}
            title={labels[action.kind].title}
            description={labels[action.kind].desc}
            confirmLabel={labels[action.kind].confirm}
            tone={labels[action.kind].tone}
            onConfirm={runAction}
          >
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Audit note…"
              className="mt-2 w-full rounded-lg border border-border bg-background p-2 text-sm" />
          </ConfirmDialog>
        )}
      </AppShell>
    </AdminGate>
  );
}
