import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Filter, Download } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { AdminGate } from "@/components/app/RoleGate";
import { adminPayments as seed, type AdminPayment } from "@/lib/mock-data";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

export const Route = createFileRoute("/app/admin/payments")({
  head: () => ({ meta: [{ title: "Payments · Admin · AgroLink" }] }),
  component: AdminPayments,
});

const TONE: Record<AdminPayment["status"], string> = {
  captured: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  held: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  refunded: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  failed: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
};

type Action = { kind: "release" | "refund" | "retry"; payment: AdminPayment } | null;

function AdminPayments() {
  const [items, setItems] = useState(seed);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | AdminPayment["status"]>("all");
  const [action, setAction] = useState<Action>(null);
  const [note, setNote] = useState("");

  const filtered = useMemo(() => items.filter((p) => {
    if (status !== "all" && p.status !== status) return false;
    if (!q) return true;
    return `${p.id} ${p.buyer} ${p.farmer} ${p.ref}`.toLowerCase().includes(q.toLowerCase());
  }), [items, q, status]);

  const runAction = async () => {
    if (!action) return;
    try {
      await simulateAdminAction(note);
      setItems((curr) => curr.map((p) => {
        if (p.id !== action.payment.id) return p;
        if (action.kind === "release") return { ...p, status: "captured" };
        if (action.kind === "refund") return { ...p, status: "refunded" };
        return { ...p, status: "captured" };
      }));
      const msg = action.kind === "release"
        ? `Released GHS ${action.payment.amountGhs} to ${action.payment.farmer}`
        : action.kind === "refund"
        ? `Refunded GHS ${action.payment.amountGhs} to ${action.payment.buyer}`
        : `Retried payment ${action.payment.ref}`;
      toast.success(msg, { description: note || `Ref ${action.payment.ref}` });
      setNote("");
    } catch (error) {
      toast.error("Payment action failed", {
        description: error instanceof Error ? error.message : "Please retry the action.",
        action: { label: "Retry", onClick: () => void runAction() },
      });
      throw error;
    }
  };

  const labels = {
    release: { title: "Release funds to farmer?", confirm: "Release funds", tone: "success" as const,
      desc: action && `Move GHS ${action.payment.amountGhs} from escrow to ${action.payment.farmer}'s wallet. This cannot be undone.` },
    refund: { title: "Refund the buyer?", confirm: "Refund buyer", tone: "danger" as const,
      desc: action && `Return GHS ${action.payment.amountGhs} to ${action.payment.buyer} via ${action.payment.channel}.` },
    retry: { title: "Retry this payment?", confirm: "Retry charge", tone: "warning" as const,
      desc: action && `Re-attempt capture for ${action.payment.ref}.` },
  };

  return (
    <AdminGate>
      <AppShell role="admin">
        <PageHeader
          eyebrow="Finance"
          title="All"
          italic="payments"
          sub="Search by reference, buyer, or farmer. Every action is logged."
          action={
            <button onClick={() => toast.message("Export queued", { description: "CSV will email shortly." })}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-card">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          }
        />

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ref, buyer, farmer…" className="w-full bg-transparent outline-none" />
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

        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-5 py-4 text-left">Ref</th>
                <th className="px-5 py-4 text-left">Buyer</th>
                <th className="px-5 py-4 text-left">Farmer</th>
                <th className="px-5 py-4 text-left">Channel</th>
                <th className="px-5 py-4 text-right">Amount</th>
                <th className="px-5 py-4 text-right">Status</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-background/40">
                  <td className="px-5 py-4">
                    <div className="font-mono text-xs text-primary/80">{p.id}</div>
                    <div className="text-[10px] text-muted-foreground">{p.ref}</div>
                  </td>
                  <td className="px-5 py-4">{p.buyer}</td>
                  <td className="px-5 py-4 text-accent">{p.farmer}</td>
                  <td className="px-5 py-4 text-muted-foreground">{p.channel}</td>
                  <td className="px-5 py-4 text-right font-serif text-lg text-primary">GHS {p.amountGhs}</td>
                  <td className="px-5 py-4 text-right">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${TONE[p.status]}`}>{p.status}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {p.status === "held" && <button onClick={() => setAction({ kind: "release", payment: p })} className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700">Release</button>}
                    {p.status === "captured" && <button onClick={() => setAction({ kind: "refund", payment: p })} className="rounded-full border border-rose-300 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">Refund</button>}
                    {p.status === "failed" && <button onClick={() => setAction({ kind: "retry", payment: p })} className="rounded-full border border-border px-3 py-1.5 text-xs">Retry</button>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">No payments match.</td></tr>
              )}
            </tbody>
          </table>
        </div>

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
            <div className="mt-2 rounded-xl border border-border bg-background p-3 text-xs">
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <div>Ref</div><div className="text-right font-mono text-foreground">{action.payment.ref}</div>
                <div>Channel</div><div className="text-right text-foreground">{action.payment.channel}</div>
                <div>Amount</div><div className="text-right font-serif text-base text-primary">GHS {action.payment.amountGhs}</div>
              </div>
            </div>
            <label className="mt-3 block text-xs text-muted-foreground">Reason / note (optional)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
              placeholder="Add an internal note for the audit log…"
              className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm outline-none focus:border-primary" />
          </ConfirmDialog>
        )}
      </AppShell>
    </AdminGate>
  );
}

async function simulateAdminAction(note: string) {
  await new Promise((r) => setTimeout(r, 600));
  if (note.toLowerCase().includes("fail")) {
    throw new Error("Processor rejected the request. Remove “fail” from the note or retry.");
  }
}
