import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Search } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { StatusBadge } from "./app.buyer";
import { LiveTrackCard } from "@/components/track/LiveTrackCard";
import { buyerOrders, trackedOrders } from "@/lib/mock-data";

export const Route = createFileRoute("/app/buyer/orders")({
  head: () => ({ meta: [{ title: "Orders · AgroLink" }] }),
  component: Orders,
});

function Orders() {
  const [tab, setTab] = useState<"active" | "history">("active");
  const [q, setQ] = useState("");

  const history = buyerOrders.filter((o) =>
    !q ? true : (o.id + o.items).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <AppShell role="buyer">
      <PageHeader
        eyebrow="History"
        title="Your"
        italic="orders"
        sub="Follow the driver live, then keep every receipt in one place."
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-border bg-card p-1 text-sm">
          {(["active", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 capitalize transition ${
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t} {t === "active" && <span className="ml-1 opacity-80">· {trackedOrders.length}</span>}
            </button>
          ))}
        </div>
        {tab === "history" && (
          <label className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            <Search className="h-3.5 w-3.5" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search past orders"
              className="w-48 bg-transparent outline-none text-foreground"
            />
          </label>
        )}
      </div>

      {tab === "active" && (
        <div className="space-y-6">
          {trackedOrders.map((o) => (
            <LiveTrackCard key={o.id} order={o} />
          ))}
          {trackedOrders.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No active orders — head to the feed to grab something fresh.
            </div>
          )}
        </div>
      )}

      {tab === "history" && (
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-5 py-4 text-left">Order</th>
                <th className="px-5 py-4 text-left">Items</th>
                <th className="px-5 py-4 text-left">Placed</th>
                <th className="px-5 py-4 text-right">Total</th>
                <th className="px-5 py-4 text-right">Status</th>
                <th className="px-5 py-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history.map((o) => (
                <tr key={o.id} className="hover:bg-background/40 transition">
                  <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{o.id}</td>
                  <td className="px-5 py-4">{o.items}</td>
                  <td className="px-5 py-4 text-muted-foreground">{o.placedAt}{o.eta && ` · ETA ${o.eta}`}</td>
                  <td className="px-5 py-4 text-right font-serif text-lg text-primary">GHS {o.totalGhs}</td>
                  <td className="px-5 py-4 text-right"><StatusBadge status={o.status} /></td>
                  <td className="px-5 py-4 text-right">
                    <a href={`#receipt-${o.id}`} className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                      <FileText className="h-3 w-3" /> PDF
                    </a>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">No matches for "{q}".</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
