import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, AlertTriangle, Check, X, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { AdminGate } from "@/components/app/RoleGate";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useDisputes } from "@/hooks/use-marketplace";
import { updateDisputeStatus, appendDisputeNote, type DisputeRow } from "@/lib/api/disputes";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/app/admin/disputes")({
  head: () => ({ meta: [{ title: "Disputes · Admin · AgroLink" }] }),
  component: AdminDisputes,
});

type UiStatus = "open" | "investigating" | "resolved" | "rejected";

function uiStatus(s: string): UiStatus {
  if (s === "closed") return "rejected";
  return s as UiStatus;
}

const TONE: Record<UiStatus, string> = {
  open: "bg-rose-500/15 text-rose-600",
  investigating: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  resolved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  rejected: "bg-muted text-muted-foreground",
};

function AdminDisputes() {
  const { data: items = [], isLoading } = useDisputes();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | UiStatus>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [pending, setPending] = useState<{ id: string; next: "investigating" | "resolved" | "closed" } | null>(null);
  const [reason, setReason] = useState("");

  const filtered = useMemo(
    () =>
      items.filter((d) => {
        const ui = uiStatus(d.status);
        if (status !== "all" && ui !== status) return false;
        if (!q) return true;
        return `${d.id} ${d.order_id} ${d.reason}`.toLowerCase().includes(q.toLowerCase());
      }),
    [items, q, status],
  );

  const active = items.find((d) => d.id === openId) ?? null;

  const confirmStatus = async () => {
    if (!pending) return;
    if (pending.next === "resolved" && !reason.trim()) {
      toast.error("Resolution note required");
      throw new Error("note required");
    }
    await updateDisputeStatus(pending.id, pending.next, reason, reason);
    await qc.invalidateQueries({ queryKey: ["disputes"] });
    toast.success("Dispute updated");
    setReason("");
  };

  return (
    <AdminGate>
      <AppShell role="admin" compact>
        <PageHeader eyebrow="Trust & Safety" title="Open" italic="disputes" sub="Live disputes from Supabase — human review within 24h." />

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dispute, order…" className="w-full bg-transparent outline-none" />
          </div>
          <div className="flex gap-1 rounded-full border border-border bg-card p-1">
            {(["all", "open", "investigating", "resolved", "rejected"] as const).map((s) => (
              <button key={s} onClick={() => setStatus(s)} className={`rounded-full px-3 py-1 text-xs capitalize ${status === s ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{s}</button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
        <div className="space-y-3">
          {filtered.map((d) => (
            <DisputeCard key={d.id} dispute={d} onOpen={() => setOpenId(d.id)} onPending={setPending} />
          ))}
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No disputes.</div>
          )}
        </div>
        )}

        <DisputeDetail dispute={active} onClose={() => setOpenId(null)} onNote={async (id, text) => {
          await appendDisputeNote(id, text);
          await qc.invalidateQueries({ queryKey: ["disputes"] });
          toast.success("Note added");
        }} />

        {pending && (
          <ConfirmDialog
            open={!!pending}
            onOpenChange={(v) => { if (!v) { setPending(null); setReason(""); } }}
            title="Update dispute?"
            description="Both parties will be notified."
            confirmLabel="Confirm"
            tone={pending.next === "resolved" ? "success" : pending.next === "closed" ? "danger" : "warning"}
            onConfirm={confirmStatus}
          >
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Resolution note…" className="mt-2 w-full rounded-lg border border-border p-2 text-sm" />
          </ConfirmDialog>
        )}
      </AppShell>
    </AdminGate>
  );
}

function DisputeCard({
  dispute: d, onOpen, onPending,
}: {
  dispute: DisputeRow;
  onOpen: () => void;
  onPending: (p: { id: string; next: "investigating" | "resolved" | "closed" }) => void;
}) {
  const ui = uiStatus(d.status);
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 text-xs">
            <span className="font-mono text-primary/80">{d.id.slice(0, 8)}</span>
            <span className={`rounded-full px-2.5 py-0.5 uppercase ${TONE[ui]}`}>{ui}</span>
          </div>
          <h3 className="mt-2 font-serif text-xl inline-flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-500" /> {d.reason}
          </h3>
          <div className="mt-1 text-xs text-muted-foreground">
            Order {d.order_id.slice(0, 8)} · {new Date(d.created_at).toLocaleString()} · GHS {d.order?.total_amount ?? "—"}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onOpen} className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs"><Eye className="h-3.5 w-3.5" /> Open</button>
          {ui !== "resolved" && ui !== "rejected" && (
            <>
              <button onClick={() => onPending({ id: d.id, next: "investigating" })} className="rounded-full border border-amber-300 px-3 py-1.5 text-xs text-amber-700">Investigate</button>
              <button onClick={() => onPending({ id: d.id, next: "resolved" })} className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs text-white"><Check className="h-3.5 w-3.5" /> Resolve</button>
              <button onClick={() => onPending({ id: d.id, next: "closed" })} className="inline-flex items-center gap-1 rounded-full border border-rose-300 px-3 py-1.5 text-xs text-rose-600"><X className="h-3.5 w-3.5" /> Close</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DisputeDetail({
  dispute, onClose, onNote,
}: {
  dispute: DisputeRow | null;
  onClose: () => void;
  onNote: (id: string, text: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  return (
    <Dialog open={!!dispute} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        {dispute && (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">{dispute.reason}</DialogTitle>
              <DialogDescription>Order {dispute.order_id.slice(0, 8)} · {dispute.description}</DialogDescription>
            </DialogHeader>
            <ol className="space-y-3 border-l border-border pl-4 text-sm">
              {(dispute.events ?? []).map((ev, i) => (
                <li key={i}>
                  <div className="text-xs text-muted-foreground">{ev.at}{ev.actor ? ` · ${ev.actor}` : ""}</div>
                  <div>{ev.text}</div>
                </li>
              ))}
            </ol>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Add admin note…" className="w-full rounded-lg border p-2 text-sm" />
            <button
              disabled={!note.trim()}
              onClick={() => { void onNote(dispute.id, note).then(() => setNote("")); }}
              className="rounded-full bg-primary px-4 py-2 text-xs text-primary-foreground disabled:opacity-50"
            >
              Add note
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
