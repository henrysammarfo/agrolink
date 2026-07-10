import type { OrderRow } from "@/lib/types/marketplace";

/** Farmer-facing fulfillment pipeline — strict top-to-bottom order. */
export const FARMER_ORDER_STEPS = [
  { id: "payment", label: "Payment" },
  { id: "accepted", label: "Accepted" },
  { id: "preparing", label: "Preparing" },
  { id: "ready", label: "Ready" },
  { id: "driver", label: "Driver" },
  { id: "transit", label: "In transit" },
  { id: "done", label: "Delivered" },
] as const;

export type FarmerStepId = (typeof FARMER_ORDER_STEPS)[number]["id"];

export function farmerStepIndex(stepId: FarmerStepId): number {
  return FARMER_ORDER_STEPS.findIndex((s) => s.id === stepId);
}

export function getFarmerStepId(order: OrderRow): FarmerStepId {
  if (order.status === "cancelled") return "payment";

  if (order.payment_status !== "paid") return "payment";

  const delivery = order.delivery;
  if (order.status === "delivered" || delivery?.status === "delivered") return "done";
  if (delivery?.status === "enroute_delivery") return "transit";
  if (delivery?.status === "picked_up") return "transit";
  if (
    delivery?.status === "driver_assigned" ||
    delivery?.status === "driver_enroute_pickup"
  ) {
    return "driver";
  }

  if (order.status === "dispatched") return "ready";
  if (order.status === "processing") return "preparing";
  if (order.status === "confirmed" || order.status === "pending") return "accepted";

  return "accepted";
}

export function getFarmerAction(order: OrderRow): {
  label: string;
  nextStatus: OrderRow["status"];
  tone: string;
} | null {
  const step = getFarmerStepId(order);
  if (order.payment_status !== "paid" || order.status === "cancelled") return null;

  if (step === "accepted" && (order.status === "confirmed" || order.status === "pending")) {
    return {
      label: "Start preparing",
      nextStatus: "processing",
      tone: "bg-indigo-600 text-white hover:bg-indigo-700",
    };
  }
  if (step === "preparing" && order.status === "processing") {
    return {
      label: "Mark ready for pickup",
      nextStatus: "dispatched",
      tone: "bg-primary text-primary-foreground hover:bg-primary/90",
    };
  }
  return null;
}

export function farmerStepHint(order: OrderRow, stepId: FarmerStepId): string | null {
  const current = getFarmerStepId(order);
  const idx = farmerStepIndex(stepId);
  const curIdx = farmerStepIndex(current);

  if (idx < curIdx) return null;
  if (idx > curIdx) return "Upcoming";

  switch (stepId) {
    case "payment":
      return order.payment_status === "paid" ? "Paid" : "Waiting for buyer payment";
    case "accepted":
      return "Payment confirmed — start when ready";
    case "preparing":
      return "Pack produce for pickup";
    case "ready":
      return "Waiting for driver at the farm";
    case "driver":
      return order.delivery?.driver?.profile?.display_name
        ? `${order.delivery.driver.profile.display_name} heading to farm`
        : "Driver assigned";
    case "transit":
      return "Driver has your produce";
    case "done":
      return "Order complete";
    default:
      return null;
  }
}

export function orderNeedsFarmerAction(order: OrderRow): boolean {
  return getFarmerAction(order) != null;
}

export function sortFarmerOrders(orders: OrderRow[]): OrderRow[] {
  return [...orders].sort((a, b) => {
    const aAction = orderNeedsFarmerAction(a) ? 0 : 1;
    const bAction = orderNeedsFarmerAction(b) ? 0 : 1;
    if (aAction !== bAction) return aAction - bAction;
    const aDone = getFarmerStepId(a) === "done" ? 1 : 0;
    const bDone = getFarmerStepId(b) === "done" ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}
