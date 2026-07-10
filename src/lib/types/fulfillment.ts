import type { OrderRow } from "@/lib/types/marketplace";
import {
  BUYER_ORDER_PIPELINE,
  getBuyerPipelineStep,
  pipelineStepHint,
  type BuyerPipelineStepId,
} from "@/lib/order-lifecycle";

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
  pipelineStep: BuyerPipelineStepId;
  timeline: OrderTimelineEvent[];
  eta?: string;
};

/** Buyer-facing 6-step summary rail (maps from full pipeline). */
export const FULFILLMENT_FLOW: { step: FulfillmentStep; label: string }[] = [
  { step: "placed", label: "Placed" },
  { step: "confirmed", label: "Confirmed" },
  { step: "packed", label: "Packed" },
  { step: "shipped", label: "Picked up" },
  { step: "in_transit", label: "In transit" },
  { step: "delivered", label: "Delivered" },
];

const PIPELINE_TO_FULFILLMENT: Record<BuyerPipelineStepId, FulfillmentStep> = {
  cart: "placed",
  delivery_setup: "placed",
  payment_checkout: "placed",
  placed: "placed",
  payment_pending: "placed",
  payment_confirmed: "confirmed",
  driver_search: "confirmed",
  driver_matched: "confirmed",
  preparing: "packed",
  ready: "packed",
  driver_pickup: "packed",
  picked_up: "shipped",
  enroute: "in_transit",
  delivered: "delivered",
};

export function orderStatusToStep(order: OrderRow): FulfillmentStep {
  return PIPELINE_TO_FULFILLMENT[getBuyerPipelineStep(order)] ?? "placed";
}

export function buildTrackedOrder(order: OrderRow): TrackedOrder {
  const itemsLabel =
    order.items
      ?.map((i) => `${i.listing?.title ?? "Item"} ${i.quantity}`)
      .join(" · ") ?? "Order items";

  const pipelineStep = getBuyerPipelineStep(order);
  const step = orderStatusToStep(order);
  const created = new Date(order.created_at);
  const timeStr = created.toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit" });

  const timeline: OrderTimelineEvent[] = [
    { step: "placed", label: "Order placed", at: timeStr, by: "You" },
  ];

  if (order.payment_status === "pending") {
    timeline.push({ step: "placed", label: "Payment pending", at: "—", note: "Complete MoMo / Paystack" });
  }
  if (order.payment_status === "paid") {
    timeline.push({ step: "confirmed", label: "Payment confirmed", at: timeStr });
  }
  if (order.delivery?.status === "requested" && order.payment_status === "paid" && !order.delivery.driver_id) {
    timeline.push({ step: "confirmed", label: "Finding driver", at: "—", note: "Scanning nearby couriers" });
  }
  if (order.delivery?.driver_id) {
    timeline.push({
      step: "confirmed",
      label: "Driver matched",
      at: "—",
      by: order.delivery.driver?.profile?.display_name ?? "Driver",
    });
  }
  if (["processing", "dispatched", "delivered"].includes(order.status)) {
    timeline.push({ step: "packed", label: "Packed by farmer", at: "—" });
  }
  if (order.delivery?.status === "driver_enroute_pickup") {
    timeline.push({ step: "packed", label: "Driver heading to farm", at: "—" });
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
    timeline.push({ step: "in_transit", label: "On the way to you", at: "—", note: "Live tracking active" });
  }
  if (order.status === "delivered" || order.delivery?.status === "delivered") {
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
    pipelineStep,
    timeline,
  };
}

export { BUYER_ORDER_PIPELINE, getBuyerPipelineStep, pipelineStepHint };
