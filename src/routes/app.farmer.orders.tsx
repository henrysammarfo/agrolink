import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { StatusBadge } from "./app.buyer";
import { farmerOrders } from "@/lib/mock-data";

export const Route = createFileRoute("/app/farmer/orders")({
  head: () => ({ meta: [{ title: "Farmer orders · AgroLink" }] }),
  component: FarmerOrders,
});

function FarmerOrders() {
  return (
    <AppShell role="farmer">
      <PageHeader eyebrow="Inbox" title="Incoming" italic="orders" />
      <div className="space-y-3">
        {farmerOrders.map((o) => (
          <div key={o.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground">{o.id}</span>
                <StatusBadge status={o.status} />
              </div>
              <div className="mt-2 font-serif text-xl">{o.buyer}</div>
              <div className="text-sm text-muted-foreground">{o.items}</div>
              <div className="mt-1 text-xs text-muted-foreground">{o.placedAt}{o.eta && ` · ETA ${o.eta}`}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-serif text-2xl text-primary">GHS {o.totalGhs}</div>
              </div>
              {o.status === "pending" && (
                <>
                  <button className="rounded-full border border-border px-4 py-2 text-sm">Decline</button>
                  <button className="rounded-full bg-foreground px-4 py-2 text-sm text-background">Accept</button>
                </>
              )}
              {o.status === "confirmed" && (
                <button className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">Mark ready</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
