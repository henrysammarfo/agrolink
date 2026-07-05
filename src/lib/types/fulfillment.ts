import type { OrderRow } from "@/lib/types/marketplace";

export type FulfillmentStep =
  | "placed"
  | "confirmed"
  | "packed"
  | "shipped"
  | "in_transit"
  | "delivered";

export type OrderTimelineEvent = {
  step: FulfillmentStep;
  label: string;
  at: string;
  by?: string;
  note?: string;
};

export type TrackedOrder = {
  id: string;
  items: string;
  totalGhs: number;
  farmer: string;
  driver?: string;
  receiptUrl: string;
  currentStep: FulfillmentStep;
  timeline: OrderTimelineEvent[];
  eta?: string;
};

export const FULFILLMENT_FLOW: { step: FulfillmentStep; label: string }[] = [
  { step: "placed", label: "Placed" },
  { step: "confirmed", label: "Confirmed" },
  { step: "packed", label: "Packed" },
  { step: "shipped", label: "Picked up" },
  { step: "in_transit", label: "In transit" },
  { step: "delivered", label: "Delivered" },
];

const ORDER_TO_STEP: Record<string, FulfillmentStep> = {
  pending: "placed",
  confirmed: "confirmed",
  processing: "packed",
  dispatched: "in_transit",
  delivered: "delivered",
  cancelled: "placed",
};

export function orderStatusToStep(status: string): FulfillmentStep {
  return ORDER_TO_STEP[status] ?? "placed";
}

export function buildTrackedOrder(order: OrderRow): TrackedOrder {
  const itemsLabel =
    order.items
      ?.map((i) => `${i.listing?.title ?? "Item"} ${i.quantity}${i.listing ? "" : ""}`)
      .join(" · ") ?? "Order items";

  const step = orderStatusToStep(order.status);
  const created = new Date(order.created_at);
  const timeline: OrderTimelineEvent[] = [
    {
      step: "placed",
      label: "Order placed",
      at: created.toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit" }),
      by: "You",
    },
  ];

  if (["confirmed", "processing", "dispatched", "delivered"].includes(order.status)) {
    timeline.push({
      step: "confirmed",
      label: "Payment confirmed",
      at: created.toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit" }),
    });
  }
  if (["processing", "dispatched", "delivered"].includes(order.status)) {
    timeline.push({ step: "packed", label: "Packed by farmer", at: "—" });
  }
  if (order.delivery?.status === "picked_up" || order.delivery?.status === "enroute_delivery") {
    timeline.push({
      step: "shipped",
      label: "Picked up",
      at: "—",
      by: order.delivery.driver?.profile?.display_name ?? "Driver",
    });
  }
  if (order.delivery?.status === "enroute_delivery") {
    timeline.push({ step: "in_transit", label: "On the way", at: "—", note: "Live tracking active" });
  }
  if (order.status === "delivered") {
    timeline.push({ step: "delivered", label: "Delivered", at: "—" });
  }

  return {
    id: order.id.slice(0, 8).toUpperCase(),
    items: itemsLabel,
    totalGhs: Number(order.total_amount),
    farmer: order.items?.[0]?.listing?.title ? "Seller" : "Farmer",
    driver: order.delivery?.driver?.profile?.display_name ?? undefined,
    receiptUrl: `/app/buyer/orders`,
    currentStep: step,
    timeline,
  };
}
