import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { StatusBadge } from "./app.buyer";
import { buyerOrders } from "@/lib/mock-data";

export const Route = createFileRoute("/app/buyer/orders")({
  head: () => ({ meta: [{ title: "Orders · AgroLink" }] }),
  component: Orders,
});

function Orders() {
  return (
    <AppShell role="buyer">
      <PageHeader eyebrow="History" title="Your" italic="orders" sub="Track active deliveries and review past purchases." />

      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-5 py-4 text-left">Order</th>
              <th className="px-5 py-4 text-left">Items</th>
              <th className="px-5 py-4 text-left">Placed</th>
              <th className="px-5 py-4 text-right">Total</th>
              <th className="px-5 py-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {buyerOrders.map((o) => (
              <tr key={o.id} className="hover:bg-background/40 transition">
                <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{o.id}</td>
                <td className="px-5 py-4">{o.items}</td>
                <td className="px-5 py-4 text-muted-foreground">{o.placedAt}{o.eta && ` · ETA ${o.eta}`}</td>
                <td className="px-5 py-4 text-right font-serif text-lg text-primary">GHS {o.totalGhs}</td>
                <td className="px-5 py-4 text-right"><StatusBadge status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
