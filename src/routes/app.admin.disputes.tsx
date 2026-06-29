import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, AlertTriangle, Check, X, Eye } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { AdminGate } from "./app.admin";
import { disputes as seed, type Dispute } from "@/lib/mock-data";

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

function AdminDisputes() {
  const [items, setItems] = useState(seed);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | Dispute["status"]>("all");

  const filtered = useMemo(() => items.filter((d) => {
    if (status !== "all" && d.status !== status) return false;
    if (!q) return true;
    return `${d.id} ${d.orderId} ${d.party} ${d.reason}`.toLowerCase().includes(q.toLowerCase());
  }), [items, q, status]);

  const setS = (id: string, s: Dispute["status"]) =>
    setItems((curr) => curr.map((d) => (d.id === id ? { ...d, status: s } : d)));

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
                  <div className="mt-1 text-xs text-muted-foreground">{d.party} · {d.openedAt}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right pr-2">
                    <div className="font-serif text-xl text-primary">GHS {d.amountGhs}</div>
                  </div>
                  <button className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-background"><Eye className="h-3.5 w-3.5" /> View</button>
                  {d.status !== "resolved" && d.status !== "rejected" && (
                    <>
                      <button onClick={() => setS(d.id, "investigating")} className="rounded-full border border-amber-300 px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30">Investigate</button>
                      <button onClick={() => setS(d.id, "resolved")} className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700"><Check className="h-3.5 w-3.5" /> Refund buyer</button>
                      <button onClick={() => setS(d.id, "rejected")} className="inline-flex items-center gap-1 rounded-full border border-rose-300 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"><X className="h-3.5 w-3.5" /> Reject</button>
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
      </AppShell>
    </AdminGate>
  );
}
