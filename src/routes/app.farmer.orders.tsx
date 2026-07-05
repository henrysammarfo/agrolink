import { createFileRoute } from "@tanstack/react-router";
import { Package, Truck, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { FarmerGate } from "@/components/app/RoleGate";
import { StatusBadge } from "./app.buyer";
import { useAuth } from "@/lib/auth";
import { useSellerOrders } from "@/hooks/use-marketplace";
import { updateOrderStatus } from "@/lib/api/orders";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/app/farmer/orders")({
  head: () => ({ meta: [{ title: "Farmer orders · AgroLink" }] }),
  component: FarmerOrders,
});

const NEXT: Record<string, { label: string; next: string; icon: typeof Check; tone: string }> = {
  pending:    { label: "Accept",       next: "confirmed",  icon: Check,   tone: "bg-emerald-600 text-white hover:bg-emerald-700" },
  confirmed:  { label: "Mark processing", next: "processing", icon: Package, tone: "bg-indigo-600 text-white hover:bg-indigo-700" },
  processing: { label: "Dispatch", next: "dispatched",    icon: Truck,   tone: "bg-blue-600 text-white hover:bg-blue-700" },
  dispatched: { label: "Mark delivered", next: "delivered", icon: Check,  tone: "bg-emerald-600 text-white hover:bg-emerald-700" },
};

function FarmerOrders() {
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useSellerOrders(user?.id);
  const qc = useQueryClient();

  const advance = async (id: string, current: string) => {
    const n = NEXT[current];
    if (!n) return;
    try {
      await updateOrderStatus(id, n.next);
      await qc.invalidateQueries({ queryKey: ["seller-orders", user?.id] });
      toast.success(n.label);
    } catch {
      toast.error("Could not update order");
    }
  };

  const decline = async (id: string) => {
    try {
      await updateOrderStatus(id, "cancelled");
      await qc.invalidateQueries({ queryKey: ["seller-orders", user?.id] });
      toast.error("Order declined");
    } catch {
      toast.error("Could not decline");
    }
  };

  return (
    <FarmerGate>
    <AppShell role="farmer">
      <PageHeader eyebrow="Fulfillment" title="Incoming" italic="orders" sub="Accept, pack, and hand off to a driver." />
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
      <div className="space-y-3">
        {orders.map((o) => {
          const action = NEXT[o.status];
          const sellerTotal = o.items?.reduce((s, i) => s + Number(i.total_price), 0) ?? o.total_amount;
          return (
            <div key={o.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-primary/80">{o.id.slice(0, 8)}</span>
                  <StatusBadge status={o.status} />
                </div>
                <div className="mt-2 font-serif text-xl">Buyer order</div>
                <div className="text-sm text-muted-foreground">
                  {o.items?.map((i) => `${i.listing?.title ?? "Item"} ×${i.quantity}`).join(" · ")}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-serif text-2xl text-primary">GHS {sellerTotal}</div>
                </div>
                {o.status === "pending" && (
                  <button onClick={() => decline(o.id)} className="rounded-full border border-rose-300 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">Decline</button>
                )}
                {action && o.status !== "delivered" && o.status !== "cancelled" && (
                  <button onClick={() => advance(o.id, o.status)} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ${action.tone}`}>
                    <action.icon className="h-4 w-4" /> {action.label}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {orders.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No orders yet.
          </div>
        )}
      </div>
      )}
    </AppShell>
    </FarmerGate>
  );
}
