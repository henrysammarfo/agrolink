import type { DeliveryRow, OrderRow } from "@/lib/types/marketplace";

/** Supabase embeds `deliveries` as an array — normalize to a single row. */
export function normalizeDelivery(
  delivery: DeliveryRow | DeliveryRow[] | null | undefined,
): DeliveryRow | undefined {
  if (!delivery) return undefined;
  return Array.isArray(delivery) ? delivery[0] : delivery;
}

export function normalizeOrderRow(order: OrderRow & { delivery?: DeliveryRow | DeliveryRow[] }): OrderRow {
  return {
    ...order,
    delivery: normalizeDelivery(order.delivery),
  };
}

export function orderHasDriver(order: OrderRow | null | undefined): boolean {
  const d = normalizeDelivery(order?.delivery);
  return !!d?.driver_id || d?.status === "driver_assigned";
}
