import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Filter, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/AppShell";
import { StatusBadge } from "./app.buyer";
import { useAdminOrders } from "@/hooks/use-marketplace";

export const Route = createFileRoute("/app/admin/orders")({
  head: () => ({ meta: [{ title: "Orders · Admin · AgroLink" }] }),
  component: AdminOrders,
});

function deliveryStatus(delivery: { status: string } | { status: string }[] | null | undefined) {
  if (!delivery) return "—";
  const row = Array.isArray(delivery) ? delivery[0] : delivery;
  return row?.status?.replace(/_/g, " ") ?? "—";
}

function AdminOrders() {
  const { data: orders = [], isLoading } = useAdminOrders();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | string>("all");

  const statuses = useMemo(() => {
    const set = new Set(orders.map((o) => o.status));
    return ["all", ...Array.from(set).sort()];
  }, [orders]);

  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        if (status !== "all" && o.status !== status) return false;
        if (!q) return true;
        const label = o.items?.map((i) => i.listing?.title).join(" ") ?? "";
        return `${o.id} ${o.buyer_id} ${label} ${o.payment_status}`.toLowerCase().includes(q.toLowerCase());
      }),
    [orders, q, status],
  );

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="All"
        italic="orders"
        sub="Platform-wide order audit — every status change is visible here."
        action={
          <button
            onClick={() => toast.message("Export queued", { description: "CSV from Supabase." })}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-card"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search order, buyer, listing…"
            className="w-full bg-transparent outline-none"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto rounded-full border border-border bg-card p-1">
          <Filter className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs capitalize ${
                status === s ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {s === "all" ? "all" : s.replace(/_/g, " ")}
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
                <th className="px-5 py-4 text-left">Order</th>
                <th className="px-5 py-4 text-left">Buyer</th>
                <th className="px-5 py-4 text-left">Items</th>
                <th className="px-5 py-4 text-right">Total</th>
                <th className="px-5 py-4 text-right">Payment</th>
                <th className="px-5 py-4 text-right">Status</th>
                <th className="px-5 py-4 text-right">Delivery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-background/40">
                  <td className="px-5 py-4">
                    <div className="font-mono text-xs text-primary/80">{o.id.slice(0, 8)}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(o.created_at).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs">{o.buyer_id.slice(0, 8)}</td>
                  <td className="px-5 py-4 max-w-[10rem] truncate text-xs">
                    {o.items?.map((i) => i.listing?.title ?? "Item").join(" · ") || "—"}
                  </td>
                  <td className="px-5 py-4 text-right font-serif text-lg text-primary">GHS {o.total_amount}</td>
                  <td className="px-5 py-4 text-right text-xs capitalize">{o.payment_status ?? "—"}</td>
                  <td className="px-5 py-4 text-right">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-5 py-4 text-right text-xs capitalize text-muted-foreground">
                    {deliveryStatus(o.delivery)}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No orders match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
