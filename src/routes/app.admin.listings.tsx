import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Check, Trash2, Eye } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { AdminGate } from "./app.admin";
import { listingReports as seed, type ListingReport } from "@/lib/mock-data";

export const Route = createFileRoute("/app/admin/listings")({
  head: () => ({ meta: [{ title: "Listing reports · Admin · AgroLink" }] }),
  component: AdminListings,
});

const TONE: Record<ListingReport["status"], string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  removed: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
};

function AdminListings() {
  const [items, setItems] = useState(seed);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | ListingReport["status"]>("all");

  const filtered = useMemo(() => items.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (!q) return true;
    return `${r.id} ${r.listingId} ${r.produce} ${r.farmer} ${r.reason}`.toLowerCase().includes(q.toLowerCase());
  }), [items, q, status]);

  const setS = (id: string, s: ListingReport["status"]) =>
    setItems((curr) => curr.map((r) => (r.id === id ? { ...r, status: s } : r)));

  return (
    <AdminGate>
      <AppShell role="admin">
        <PageHeader
          eyebrow="Moderation"
          title="Listing"
          italic="reports"
          sub="Approve to keep the listing live, or remove it from the marketplace."
        />

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search listing, produce, farmer…" className="w-full bg-transparent outline-none" />
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-card p-1">
            {(["all", "pending", "approved", "removed"] as const).map((s) => (
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
                <th className="px-5 py-4 text-left">Report</th>
                <th className="px-5 py-4 text-left">Listing</th>
                <th className="px-5 py-4 text-left">Farmer</th>
                <th className="px-5 py-4 text-left">Reason</th>
                <th className="px-5 py-4 text-right">Status</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-background/40 align-top">
                  <td className="px-5 py-4">
                    <div className="font-mono text-xs text-primary/80">{r.id}</div>
                    <div className="text-[10px] text-muted-foreground">{r.reportedAt}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium">{r.produce}</div>
                    <div className="text-xs text-accent">{r.listingId}</div>
                  </td>
                  <td className="px-5 py-4 text-emerald-700 dark:text-emerald-300">{r.farmer}</td>
                  <td className="px-5 py-4 text-muted-foreground max-w-[20rem]">{r.reason}</td>
                  <td className="px-5 py-4 text-right">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${TONE[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-background"><Eye className="h-3.5 w-3.5" /> View</button>
                      {r.status === "pending" && (
                        <>
                          <button onClick={() => setS(r.id, "approved")} className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700"><Check className="h-3.5 w-3.5" /> Keep</button>
                          <button onClick={() => setS(r.id, "removed")} className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1.5 text-xs text-white hover:bg-rose-700"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">No reports match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </AppShell>
    </AdminGate>
  );
}
