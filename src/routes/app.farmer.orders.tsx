import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Package, Truck, Check, Clock } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { FarmerGate } from "@/components/app/RoleGate";
import { StatusBadge } from "./app.buyer";
import { farmerOrders } from "@/lib/mock-data";

export const Route = createFileRoute("/app/farmer/orders")({
  head: () => ({ meta: [{ title: "Farmer orders · AgroLink" }] }),
  component: FarmerOrders,
});

const NEXT: Record<string, { label: string; next: string; icon: typeof Check; tone: string }> = {
  pending:    { label: "Accept",       next: "confirmed",  icon: Check,   tone: "bg-emerald-600 text-white hover:bg-emerald-700" },
  confirmed:  { label: "Mark packed",  next: "packed",     icon: Package, tone: "bg-indigo-600 text-white hover:bg-indigo-700" },
  packed:     { label: "Mark shipped", next: "shipped",    icon: Truck,   tone: "bg-blue-600 text-white hover:bg-blue-700" },
  shipped:    { label: "In transit",   next: "in_transit", icon: Clock,   tone: "bg-primary text-primary-foreground hover:bg-primary/90" },
  in_transit: { label: "Mark delivered", next: "delivered", icon: Check,  tone: "bg-emerald-600 text-white hover:bg-emerald-700" },
};

function FarmerOrders() {
  const [orders, setOrders] = useState(farmerOrders);

  const advance = (id: string) => {
    setOrders((curr) => curr.map((o) => {
      if (o.id !== id) return o;
      const n = NEXT[o.status];
      return n ? { ...o, status: n.next as typeof o.status } : o;
    }));
  };

  const decline = (id: string) => {
    setOrders((curr) => curr.map((o) => o.id === id ? { ...o, status: "cancelled" } : o));
  };

  return (
    <FarmerGate>
    <AppShell role="farmer">
      <PageHeader eyebrow="Fulfillment" title="Incoming" italic="orders" sub="Accept, pack, and hand off to a driver." />
      <div className="space-y-3">
        {orders.map((o) => {
          const action = NEXT[o.status];
          return (
            <div key={o.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-primary/80">{o.id}</span>
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
                  <button onClick={() => decline(o.id)} className="rounded-full border border-rose-300 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">Decline</button>
                )}
                {action && o.status !== "delivered" && (
                  <button onClick={() => advance(o.id)} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ${action.tone}`}>
                    <action.icon className="h-4 w-4" /> {action.label}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
    </FarmerGate>
  );
}
