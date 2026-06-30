import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  Search, AlertTriangle, Check, X, Eye, Paperclip, Upload, FileText, MessageSquare,
  CircleDot, Shield, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { AdminGate } from "./app.admin";
import { disputes as seed, type Dispute, type DisputeEvent } from "@/lib/mock-data";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/app/admin/disputes")({
  head: () => ({ meta: [{ title: "Disputes · Admin · AgroLink" }] }),
  component: AdminDisputes,
});

const TONE: Record<Dispute["status"], string> = {
  open: "bg-rose-500/15 text-rose-600",
  investigating: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  resolved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  rejected: "bg-muted text-muted-foreground",
};

const ICON: Record<DisputeEvent["kind"], typeof CircleDot> = {
  opened: AlertTriangle,
  note: MessageSquare,
  evidence: Paperclip,
  status: RefreshCw,
  resolved: Check,
  rejected: X,
};

const ICON_TONE: Record<DisputeEvent["kind"], string> = {
  opened: "bg-rose-500/15 text-rose-600",
  note: "bg-primary/15 text-primary",
  evidence: "bg-blue-500/15 text-blue-600",
  status: "bg-amber-500/15 text-amber-600",
  resolved: "bg-emerald-500/15 text-emerald-600",
  rejected: "bg-muted text-muted-foreground",
};

function AdminDisputes() {
  const [items, setItems] = useState(seed);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | Dispute["status"]>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [pending, setPending] = useState<{ id: string; next: "investigating" | "resolved" | "rejected" } | null>(null);
  const [reason, setReason] = useState("");

  const filtered = useMemo(() => items.filter((d) => {
    if (status !== "all" && d.status !== status) return false;
    if (!q) return true;
    return `${d.id} ${d.orderId} ${d.party} ${d.reason}`.toLowerCase().includes(q.toLowerCase());
  }), [items, q, status]);

  const active = items.find((d) => d.id === openId) ?? null;

  const appendEvent = (id: string, ev: DisputeEvent, next?: Dispute["status"]) =>
    setItems((curr) => curr.map((d) =>
      d.id === id ? { ...d, status: next ?? d.status, timeline: [...d.timeline, ev] } : d
    ));

  const confirmStatus = async () => {
    if (!pending) return;
    await new Promise((r) => setTimeout(r, 500));
    const labelMap = { investigating: "Marked as investigating", resolved: "Refund issued · buyer notified", rejected: "Dispute rejected" } as const;
    const kindMap = { investigating: "status" as const, resolved: "resolved" as const, rejected: "rejected" as const };
    appendEvent(pending.id, {
      at: "Just now",
      actor: "Admin · You",
      kind: kindMap[pending.next],
      text: reason || labelMap[pending.next],
    }, pending.next);
    toast.success(labelMap[pending.next], { description: reason || `Dispute ${pending.id} updated` });
    setReason("");
  };

  const pendingMeta = pending && {
    investigating: { title: "Move to investigating?", confirm: "Start investigation", tone: "warning" as const,
      desc: "The buyer and farmer will be notified that a human is reviewing this case." },
    resolved: { title: "Refund the buyer & resolve?", confirm: "Refund buyer", tone: "success" as const,
      desc: "Funds return to the buyer. Farmer payout is reversed from escrow." },
    rejected: { title: "Reject this dispute?", confirm: "Reject dispute", tone: "danger" as const,
      desc: "The dispute closes with no refund. Both parties will be notified." },
  }[pending.next];

  return (
    <AdminGate>
      <AppShell role="admin">
        <PageHeader
          eyebrow="Trust & Safety"
          title="Open"
          italic="disputes"
          sub="Every dispute is reviewed by a human within 24 hours."
        />

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dispute, order, party…" className="w-full bg-transparent outline-none" />
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-card p-1">
            {(["all", "open", "investigating", "resolved", "rejected"] as const).map((s) => (
              <button key={s} onClick={() => setStatus(s)}
                className={`rounded-full px-3 py-1 text-xs capitalize ${status === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map((d) => (
            <div key={d.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-mono text-primary/80">{d.id}</span>
                    <span className="text-muted-foreground">Order {d.orderId}</span>
                    <span className={`rounded-full px-2.5 py-0.5 uppercase tracking-wider ${TONE[d.status]}`}>{d.status}</span>
                    <span className="capitalize text-accent">by {d.raisedBy}</span>
                  </div>
                  <h3 className="mt-2 font-serif text-xl text-foreground inline-flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-500" /> {d.reason}
                  </h3>
                  <div className="mt-1 text-xs text-muted-foreground">{d.party} · {d.openedAt} · {d.timeline.length} events</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-right pr-2">
                    <div className="font-serif text-xl text-primary">GHS {d.amountGhs}</div>
                  </div>
                  <button onClick={() => setOpenId(d.id)} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-background"><Eye className="h-3.5 w-3.5" /> Open</button>
                  {d.status !== "resolved" && d.status !== "rejected" && (
                    <>
                      <button onClick={() => setPending({ id: d.id, next: "investigating" })} className="rounded-full border border-amber-300 px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30">Investigate</button>
                      <button onClick={() => setPending({ id: d.id, next: "resolved" })} className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700"><Check className="h-3.5 w-3.5" /> Refund buyer</button>
                      <button onClick={() => setPending({ id: d.id, next: "rejected" })} className="inline-flex items-center gap-1 rounded-full border border-rose-300 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"><X className="h-3.5 w-3.5" /> Reject</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">No disputes match.</div>
          )}
        </div>

        <DisputeDetail
          dispute={active}
          onClose={() => setOpenId(null)}
          onAppend={appendEvent}
          onRequestStatus={(next) => active && setPending({ id: active.id, next })}
        />

        {pending && pendingMeta && (
          <ConfirmDialog
            open={!!pending}
            onOpenChange={(v) => { if (!v) { setPending(null); setReason(""); } }}
            title={pendingMeta.title}
            description={pendingMeta.desc}
            confirmLabel={pendingMeta.confirm}
            tone={pendingMeta.tone}
            onConfirm={confirmStatus}
          >
            <label className="mt-2 block text-xs text-muted-foreground">Resolution note {pending.next === "resolved" && <span className="text-rose-500">(required)</span>}</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
              placeholder="Explain the decision for the audit log and both parties…"
              className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm outline-none focus:border-primary" />
          </ConfirmDialog>
        )}
      </AppShell>
    </AdminGate>
  );
}

function DisputeDetail({
  dispute, onClose, onAppend, onRequestStatus,
}: {
  dispute: Dispute | null;
  onClose: () => void;
  onAppend: (id: string, ev: DisputeEvent) => void;
  onRequestStatus: (next: "investigating" | "resolved" | "rejected") => void;
}) {
  const [note, setNote] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const addNote = () => {
    if (!dispute || !note.trim()) return;
    onAppend(dispute.id, { at: "Just now", actor: "Admin · You", kind: "note", text: note.trim() });
    toast.success("Note added to timeline");
    setNote("");
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !dispute) return;
    onAppend(dispute.id, { at: "Just now", actor: "Admin · You", kind: "evidence", text: `Uploaded evidence (${(f.size / 1024).toFixed(0)} KB)`, evidenceName: f.name });
    toast.success("Evidence uploaded", { description: f.name });
    e.target.value = "";
  };

  return (
    <Dialog open={!!dispute} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {dispute && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 text-xs">
                <span className="font-mono text-primary/80">{dispute.id}</span>
                <span className="text-muted-foreground">Order {dispute.orderId}</span>
                <span className={`rounded-full px-2.5 py-0.5 uppercase tracking-wider ${TONE[dispute.status]}`}>{dispute.status}</span>
              </div>
              <DialogTitle className="mt-1 font-serif text-2xl">{dispute.reason}</DialogTitle>
              <DialogDescription className="text-sm">
                Raised by <span className="capitalize text-accent">{dispute.raisedBy}</span> · {dispute.party} · {dispute.openedAt}
              </DialogDescription>
            </DialogHeader>

            {dispute.description && (
              <div className="rounded-xl border border-border bg-background p-3 text-sm text-muted-foreground">{dispute.description}</div>
            )}

            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <Shield className="h-3.5 w-3.5 text-primary" /> Timeline
              </div>
              <ol className="relative space-y-4 border-l border-border pl-5">
                {dispute.timeline.map((ev, i) => {
                  const Icon = ICON[ev.kind];
                  return (
                    <li key={i} className="relative">
                      <span className={`absolute -left-[27px] grid h-5 w-5 place-items-center rounded-full ${ICON_TONE[ev.kind]}`}>
                        <Icon className="h-3 w-3" />
                      </span>
                      <div className="text-xs text-muted-foreground">{ev.at} · <span className="text-foreground">{ev.actor}</span></div>
                      <div className="mt-0.5 text-sm text-foreground">{ev.text}</div>
                      {ev.evidenceName && (
                        <a href="#" onClick={(e) => e.preventDefault()} className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                          <FileText className="h-3 w-3" /> {ev.evidenceName}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Add to case</div>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                placeholder="Internal note (visible only to admins)…"
                className="w-full rounded-lg border border-border bg-background p-2 text-sm outline-none focus:border-primary" />
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={addNote} disabled={!note.trim()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  <MessageSquare className="h-3.5 w-3.5" /> Add note
                </button>
                <button onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-background">
                  <Upload className="h-3.5 w-3.5" /> Upload evidence
                </button>
                <input ref={fileRef} type="file" hidden onChange={onFile} accept="image/*,.pdf,.txt" />
              </div>
            </div>

            {dispute.status !== "resolved" && dispute.status !== "rejected" && (
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button onClick={() => onRequestStatus("investigating")} className="rounded-full border border-amber-300 px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30">Investigate</button>
                <button onClick={() => onRequestStatus("rejected")} className="inline-flex items-center gap-1 rounded-full border border-rose-300 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"><X className="h-3.5 w-3.5" /> Reject</button>
                <button onClick={() => onRequestStatus("resolved")} className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700"><Check className="h-3.5 w-3.5" /> Refund buyer</button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
