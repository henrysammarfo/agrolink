import type { OrderRow } from "@/lib/types/marketplace";

/** Checkout main steps — Cart → Delivery → Payment */
export const CHECKOUT_MAIN_STEPS = [
  { id: "cart", label: "Cart" },
  { id: "delivery", label: "Delivery" },
  { id: "payment", label: "Payment" },
] as const;

/** Delivery setup substeps inside checkout step 2 (before payment). */
export const DELIVERY_SETUP_SUBSTEPS = [
  { id: "mode", label: "Mode" },
  { id: "address", label: "Address" },
  { id: "vehicle", label: "Vehicle" },
  { id: "quote", label: "Quote" },
  { id: "drivers", label: "Drivers" },
] as const;

export type DeliverySetupSubstepId = (typeof DELIVERY_SETUP_SUBSTEPS)[number]["id"];

/** Full buyer order pipeline from checkout through delivery. */
export const BUYER_ORDER_PIPELINE = [
  { id: "cart", label: "Cart", phase: "checkout" as const },
  { id: "delivery_setup", label: "Delivery setup", phase: "checkout" as const },
  { id: "payment_checkout", label: "Pay", phase: "checkout" as const },
  { id: "placed", label: "Order placed", phase: "order" as const },
  { id: "payment_pending", label: "Payment pending", phase: "payment" as const },
  { id: "payment_confirmed", label: "Payment confirmed", phase: "payment" as const },
  { id: "driver_search", label: "Finding driver", phase: "delivery" as const },
  { id: "driver_matched", label: "Driver matched", phase: "delivery" as const },
  { id: "preparing", label: "Preparing", phase: "fulfillment" as const },
  { id: "ready", label: "Ready", phase: "fulfillment" as const },
  { id: "driver_pickup", label: "Driver to farm", phase: "delivery" as const },
  { id: "picked_up", label: "Picked up", phase: "delivery" as const },
  { id: "enroute", label: "On the way", phase: "delivery" as const },
  { id: "delivered", label: "Delivered", phase: "done" as const },
] as const;

export type BuyerPipelineStepId = (typeof BUYER_ORDER_PIPELINE)[number]["id"];

export function pipelineIndex(stepId: BuyerPipelineStepId): number {
  return BUYER_ORDER_PIPELINE.findIndex((s) => s.id === stepId);
}

/** Derive which delivery-setup substep is active during checkout step 2. */
export function getDeliverySetupSubstep(input: {
  fulfillmentMode: string;
  hasAddress: boolean;
  hasVehicle: boolean;
  hasQuote: boolean;
  driversNearby: number;
}): DeliverySetupSubstepId {
  if (input.fulfillmentMode !== "platform_delivery") return "mode";
  if (!input.hasAddress) return "address";
  if (!input.hasVehicle) return "vehicle";
  if (!input.hasQuote) return "quote";
  return "drivers";
}

export function deliverySetupSubstepIndex(id: DeliverySetupSubstepId): number {
  return DELIVERY_SETUP_SUBSTEPS.findIndex((s) => s.id === id);
}

/** Derive buyer pipeline step from a live order row. */
export function getBuyerPipelineStep(order: OrderRow): BuyerPipelineStepId {
  if (order.status === "cancelled") return "placed";

  const delivery = order.delivery;

  if (order.status === "delivered" || delivery?.status === "delivered") return "delivered";
  if (delivery?.status === "enroute_delivery") return "enroute";
  if (delivery?.status === "picked_up") return "picked_up";
  if (delivery?.status === "driver_enroute_pickup") return "driver_pickup";

  if (order.status === "dispatched") return "ready";
  if (order.status === "processing") return "preparing";

  if (delivery?.driver_id && delivery.status !== "requested") return "driver_matched";
  if (delivery?.status === "requested" && order.payment_status === "paid") return "driver_search";

  if (order.payment_status === "paid") return "payment_confirmed";
  if (order.payment_status === "pending") return "payment_pending";

  return "placed";
}

export function isOrderActive(order: OrderRow): boolean {
  if (order.status === "cancelled") return false;
  if (order.status === "delivered") return false;
  if (order.delivery?.status === "delivered") return false;
  return true;
}

export function pipelineStepHint(order: OrderRow, stepId: BuyerPipelineStepId): string | null {
  const current = getBuyerPipelineStep(order);
  const idx = pipelineIndex(stepId);
  const curIdx = pipelineIndex(current);

  if (idx < curIdx) return null;
  if (idx > curIdx) return "Upcoming";

  switch (stepId) {
    case "placed":
      return "Order created — complete payment to confirm";
    case "payment_pending":
      return "Waiting for MoMo / Paystack approval";
    case "payment_confirmed":
      return "Paid — farmer notified";
    case "driver_search":
      return "Scanning for verified drivers nearby";
    case "driver_matched":
      return order.delivery?.driver?.profile?.display_name
        ? `${order.delivery.driver.profile.display_name} accepted your trip`
        : "Driver assigned";
    case "preparing":
      return "Farmer is packing your produce";
    case "ready":
      return "Produce ready — driver heading to farm";
    case "driver_pickup":
      return "Driver en route to pickup point";
    case "picked_up":
      return "Produce collected from farm";
    case "enroute":
      return "Driver heading to your address";
    case "delivered":
      return "Enjoy your fresh produce!";
    default:
      return null;
  }
}

/** Payment-only steps for tracking views. */
export const PAYMENT_TRACKING_STEPS = [
  { id: "initiated", label: "Initiated" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
] as const;

export function getPaymentTrackingStep(
  paymentStatus: OrderRow["payment_status"],
): (typeof PAYMENT_TRACKING_STEPS)[number]["id"] {
  if (paymentStatus === "paid") return "confirmed";
  if (paymentStatus === "pending") return "pending";
  return "initiated";
}

/** Driver delivery substeps (post-accept). */
export const DRIVER_DELIVERY_SUBSTEPS = [
  { id: "driver_assigned", label: "Accepted" },
  { id: "driver_enroute_pickup", label: "To farm" },
  { id: "picked_up", label: "Picked up" },
  { id: "enroute_delivery", label: "To buyer" },
  { id: "delivered", label: "Delivered" },
] as const;

export function driverDeliverySubstepIndex(status: string): number {
  const idx = DRIVER_DELIVERY_SUBSTEPS.findIndex((s) => s.id === status);
  return idx >= 0 ? idx : 0;
}

/** Stress-test: verify step order never regresses for a sequence of state changes. */
export function assertMonotonicPipeline(
  steps: BuyerPipelineStepId[],
): { ok: true } | { ok: false; at: number; prev: BuyerPipelineStepId; next: BuyerPipelineStepId } {
  for (let i = 1; i < steps.length; i++) {
    const prevIdx = pipelineIndex(steps[i - 1]!);
    const nextIdx = pipelineIndex(steps[i]!);
    if (nextIdx < prevIdx) {
      return { ok: false, at: i, prev: steps[i - 1]!, next: steps[i]! };
    }
  }
  return { ok: true };
}

/** Build a minimal OrderRow for stress tests. */
export function mockOrder(partial: Partial<OrderRow> & Pick<OrderRow, "status" | "payment_status">): OrderRow {
  return {
    id: "test-order",
    buyer_id: "buyer",
    subtotal: 50,
    delivery_fee: 10,
    platform_fee: 3,
    total_amount: 63,
    delivery_address: "Accra",
    delivery_lat: 5.6,
    delivery_lng: -0.18,
    created_at: new Date().toISOString(),
    ...partial,
  };
}
