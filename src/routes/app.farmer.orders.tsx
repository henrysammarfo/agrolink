import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Package, Truck, Check, Loader2, Phone, MessageCircle, Clock } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/AppShell";
import { SellerStudioLayout } from "@/components/seller/SellerStudioLayout";
import { FarmerOrderStepper } from "@/components/order/FarmerOrderStepper";
import { StatusBadge } from "./app.buyer";
import { useAuth } from "@/lib/auth";
import { useSellerOrders } from "@/hooks/use-marketplace";
import { updateOrderStatus } from "@/lib/api/orders";
import {
  getFarmerAction,
  getFarmerStepId,
  orderNeedsFarmerAction,
  sortFarmerOrders,
} from "@/lib/farmer-order-flow";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/app/farmer/orders")({
  head: () => ({ meta: [{ title: "Farmer orders · AgroLink" }] }),
  component: FarmerOrders,
});

type Tab = "action" | "active" | "done";

function FarmerOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: orders = [], isLoading } = useSellerOrders(user?.id);
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("action");

  const sorted = useMemo(() => sortFarmerOrders(orders), [orders]);

  const visible = useMemo(() => {
    return sorted.filter((o) => {
      const step = getFarmerStepId(o);
      if (tab === "action") return orderNeedsFarmerAction(o);
      if (tab === "done") return step === "done" || o.status === "cancelled";
      return step !== "done" && o.status !== "cancelled" && !orderNeedsFarmerAction(o);
    });
  }, [sorted, tab]);

  const counts = useMemo(() => ({
    action: sorted.filter(orderNeedsFarmerAction).length,
    active: sorted.filter((o) => {
      const step = getFarmerStepId(o);
      return step !== "done" && o.status !== "cancelled" && !orderNeedsFarmerAction(o);
    }).length,
    done: sorted.filter((o) => getFarmerStepId(o) === "done" || o.status === "cancelled").length,
  }), [sorted]);

  const advance = async (id: string, nextStatus: string, label: string) => {
    try {
      await updateOrderStatus(id, nextStatus);
      await qc.invalidateQueries({ queryKey: ["seller-orders", user?.id] });
      toast.success(label);
    } catch {
      toast.error("Could not update order");
    }
  };

  const decline = async (id: string) => {
    try {
      await updateOrderStatus(id, "cancelled");
      await qc.invalidateQueries({ queryKey: ["seller-orders", user?.id] });
      toast.message("Order declined");
    } catch {
      toast.error("Could not decline");
    }
  };

  return (
    <SellerStudioLayout>
        <PageHeader
          eyebrow="Fulfillment"
          title="Incoming"
          italic="orders"
          sub="Follow each step in order — payment, prepare, hand off to driver, delivered."
        />

        <div className="mb-6 inline-flex rounded-full border border-border bg-card p-1 text-sm">
          {([
            ["action", "Needs action", counts.action],
            ["active", "In progress", counts.active],
            ["done", "Completed", counts.done],
          ] as const).map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-1.5 transition ${tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {label}
              {count > 0 && <span className="ml-1 opacity-80">· {count}</span>}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {visible.map((o) => {
              const action = getFarmerAction(o);
              const step = getFarmerStepId(o);
              const sellerTotal = o.items?.reduce((s, i) => s + Number(i.total_price), 0) ?? o.total_amount;
              const canDecline = o.payment_status !== "paid" && o.status === "pending";

              return (
                <article
                  key={o.id}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                >
                  <div className="border-b border-border bg-muted/30 px-5 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-primary/80">{o.id.slice(0, 8)}</span>
                        <StatusBadge status={o.status} />
                        {o.payment_status !== "paid" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-300">
                            <Clock className="h-3 w-3" /> Awaiting payment
                          </span>
                        )}
                      </div>
                      <div className="font-serif text-xl text-primary">GHS {sellerTotal}</div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="text-sm text-muted-foreground">
                      {o.items?.map((i) => `${i.listing?.title ?? "Item"} ×${i.quantity}`).join(" · ")}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleString()}
                    </div>

                    <FarmerOrderStepper order={o} />

                    {o.delivery && step !== "payment" && (
                      <div className="mt-4 rounded-xl border border-border bg-background p-3 text-sm">
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Delivery
                        </div>
                        <div className="mt-1 capitalize text-foreground">
                          {o.delivery.status.replace(/_/g, " ")}
                        </div>
                        {o.delivery.driver ? (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 font-medium">
                              <Truck className="h-3.5 w-3.5 text-primary" />
                              {o.delivery.driver.profile?.display_name ?? "Driver"}
                            </span>
                            {o.delivery.driver.profile?.phone && (
                              <a
                                href={`tel:${o.delivery.driver.profile.phone}`}
                                className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs"
                              >
                                <Phone className="h-3 w-3" /> Call
                              </a>
                            )}
                            {o.delivery.driver.user_id && (
                              <button
                                type="button"
                                onClick={() =>
                                  navigate({
                                    to: "/app/inbox/chat/$userId",
                                    params: { userId: o.delivery!.driver!.user_id },
                                    search: { order: o.id },
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs"
                              >
                                <MessageCircle className="h-3 w-3" /> Message
                              </button>
                            )}
                          </div>
                        ) : step === "ready" ? (
                          <p className="mt-1 text-xs text-muted-foreground">Finding a driver nearby…</p>
                        ) : null}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                      {canDecline && (
                        <button
                          type="button"
                          onClick={() => decline(o.id)}
                          className="rounded-full border border-rose-300 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          Decline
                        </button>
                      )}
                      {action && (
                        <button
                          type="button"
                          onClick={() => advance(o.id, action.nextStatus, action.label)}
                          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ${action.tone}`}
                        >
                          {action.nextStatus === "processing" ? (
                            <Package className="h-4 w-4" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          {action.label}
                        </button>
                      )}
                      {step === "done" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-300">
                          <Check className="h-3 w-3" /> Complete
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
            {visible.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                {tab === "action"
                  ? "Nothing needs your action right now."
                  : tab === "active"
                    ? "No orders in progress."
                    : "No completed orders yet."}
              </div>
            )}
          </div>
        )}
    </SellerStudioLayout>
  );
}
