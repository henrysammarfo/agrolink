/** Supabase select without invalid driver→profile FK embed. */
export const ORDER_WITH_DELIVERY_SELECT = `
  *,
  items:order_items(*, listing:listings(title, image_url, created_at)),
  delivery:deliveries(*, driver:driver_profiles(*))
`;

export type DriverProfileSnippet = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  slug: string | null;
  username: string | null;
};

type DeliverySingle = {
  driver?: { user_id?: string; profile?: DriverProfileSnippet } | null;
};

type DeliveryLike = DeliverySingle | DeliverySingle[] | null | undefined;

type OrderLike = {
  delivery?: DeliveryLike;
};

function normalizeDelivery(delivery: DeliveryLike): DeliverySingle | undefined {
  if (!delivery) return undefined;
  return Array.isArray(delivery) ? delivery[0] : delivery;
}

/** Attach profiles to nested driver rows (driver_profiles.user_id → profiles.id). */
export function attachDriverProfiles<T extends OrderLike>(
  orders: T[],
  profiles: DriverProfileSnippet[],
): T[] {
  if (!orders.length || !profiles.length) return orders;
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  return orders.map((order) => {
    const delivery = normalizeDelivery(order.delivery);
    const driver = delivery?.driver;
    if (!driver?.user_id) return order;

    const profile = profileMap.get(driver.user_id);
    if (!profile) return order;

    const enrichedDriver = { ...driver, profile };
    const enrichedDelivery = { ...delivery, driver: enrichedDriver };

    return {
      ...order,
      delivery: Array.isArray(order.delivery) ? [enrichedDelivery] : enrichedDelivery,
    };
  });
}

export function collectDriverUserIds(orders: OrderLike[]): string[] {
  const ids = new Set<string>();
  for (const order of orders) {
    const delivery = normalizeDelivery(order.delivery);
    if (delivery?.driver?.user_id) ids.add(delivery.driver.user_id);
  }
  return [...ids];
}

type DeliveryWithOrder = {
  order?: { buyer_id?: string; buyer?: DriverProfileSnippet } | null;
};

/** Attach buyer profiles to delivery rows (orders.buyer_id → profiles.id). */
export function attachBuyerProfiles<T extends DeliveryWithOrder>(
  deliveries: T[],
  profiles: DriverProfileSnippet[],
): T[] {
  if (!deliveries.length || !profiles.length) return deliveries;
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  return deliveries.map((row) => {
    const buyerId = row.order?.buyer_id;
    if (!buyerId) return row;
    const buyer = profileMap.get(buyerId);
    if (!buyer) return row;
    return { ...row, order: { ...row.order, buyer } };
  });
}

export function collectBuyerUserIds(deliveries: DeliveryWithOrder[]): string[] {
  const ids = new Set<string>();
  for (const row of deliveries) {
    if (row.order?.buyer_id) ids.add(row.order.buyer_id);
  }
  return [...ids];
}
