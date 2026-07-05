import crypto from "node:crypto";

const PAYSTACK_BASE = "https://api.paystack.co";

export type PaystackChargeResult = {
  status: boolean;
  message: string;
  data?: {
    reference: string;
    status: string;
    display_text?: string;
  };
};

export async function initiatePaystackMoMoCharge(params: {
  amount: number;
  email: string;
  phone: string;
  provider: "mtn" | "vod" | "atl";
  idempotencyKey: string;
}): Promise<PaystackChargeResult> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return {
      status: true,
      message: "Demo mode — no Paystack secret configured",
      data: {
        reference: `demo-${params.idempotencyKey}`,
        status: "pay_offline",
        display_text: "Demo: approve on test phone 0551234987",
      },
    };
  }

  const res = await fetch(`${PAYSTACK_BASE}/charge`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(params.amount * 100),
      email: params.email,
      currency: "GHS",
      reference: params.idempotencyKey,
      mobile_money: {
        phone: params.phone.replace(/\D/g, "").replace(/^233/, "0"),
        provider: params.provider,
      },
    }),
  });

  return res.json() as Promise<PaystackChargeResult>;
}

export function verifyPaystackSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET ?? process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;
  const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  return hash === signature;
}

export async function verifyPaystackTransaction(reference: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return { status: true, data: { status: "success" } };

  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  return res.json();
}

export async function processCheckout(params: {
  userId: string;
  email: string;
  phone: string;
  momoProvider: "mtn" | "vod" | "atl";
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
}): Promise<{ orderId: string; paymentReference: string; displayText?: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: cart } = await supabaseAdmin
    .from("carts")
    .select("id")
    .eq("user_id", params.userId)
    .maybeSingle();
  if (!cart) throw new Error("Cart is empty");

  const { data: items } = await supabaseAdmin
    .from("cart_items")
    .select("*, listing:listings(*)")
    .eq("cart_id", cart.id);
  if (!items?.length) throw new Error("Cart is empty");

  const subtotal = items.reduce((s, it) => {
    const listing = it.listing as { price_per_unit: number };
    return s + Number(listing.price_per_unit) * Number(it.quantity);
  }, 0);

  const firstListing = items[0].listing as {
    lat: number;
    lng: number;
    location_name: string;
    unit: string;
  };
  const weightKg = items.reduce((s, it) => s + Number(it.quantity), 0);
  const deliveryLat = params.deliveryLat ?? firstListing.lat;
  const deliveryLng = params.deliveryLng ?? firstListing.lng;

  const { computeDeliveryQuote } = await import("@/server/delivery-quote");
  const quote = await computeDeliveryQuote({
    pickupLat: firstListing.lat,
    pickupLng: firstListing.lng,
    deliveryLat,
    deliveryLng,
    weightKg,
    vehicleType: weightKg > 80 ? "truck" : weightKg > 40 ? "pickup" : "motorcycle",
  });

  const deliveryFee = quote.total;
  const platformFee = Math.round(subtotal * quote.pricingConfig.platform_fee_pct * 100) / 100;
  const total = subtotal + deliveryFee + platformFee;
  const feeBreakdown = {
    distanceKm: quote.distanceKm,
    breakdown: quote.breakdown,
    baseFare: quote.baseFare,
    peakMultiplier: quote.peakMultiplier,
    vehicleMultiplier: quote.vehicleMultiplier,
  };
  const idempotencyKey = `agrolink-${params.userId.slice(0, 8)}-${Date.now()}`;

  const { data: order, error: orderErr } = await supabaseAdmin
    .from("orders")
    .insert({
      buyer_id: params.userId,
      status: "pending",
      payment_status: "pending",
      subtotal,
      delivery_fee: deliveryFee,
      platform_fee: platformFee,
      total_amount: total,
      delivery_fee_breakdown: feeBreakdown,
      delivery_address: params.deliveryAddress ?? null,
      delivery_lat: deliveryLat,
      delivery_lng: deliveryLng,
    })
    .select()
    .single();
  if (orderErr) throw orderErr;

  const orderItems = items.map((it) => {
    const listing = it.listing as { id: string; seller_id: string; price_per_unit: number };
    return {
      order_id: order.id,
      listing_id: listing.id,
      seller_id: listing.seller_id,
      quantity: it.quantity,
      unit_price: listing.price_per_unit,
      total_price: Number(listing.price_per_unit) * Number(it.quantity),
    };
  });
  await supabaseAdmin.from("order_items").insert(orderItems);

  await supabaseAdmin.from("deliveries").insert({
    order_id: order.id,
    pickup_lat: firstListing.lat,
    pickup_lng: firstListing.lng,
    pickup_address: firstListing.location_name,
    delivery_lat: deliveryLat,
    delivery_lng: deliveryLng,
    delivery_address: params.deliveryAddress ?? "Buyer address",
    estimated_distance_km: quote.distanceKm,
    delivery_fee: deliveryFee,
    fee_breakdown: feeBreakdown,
    status: "requested",
  });

  await supabaseAdmin.from("payments").insert({
    order_id: order.id,
    provider: "paystack",
    amount: total,
    status: "pending",
    idempotency_key: idempotencyKey,
    provider_reference: idempotencyKey,
  });

  const charge = await initiatePaystackMoMoCharge({
    amount: total,
    email: params.email,
    phone: params.phone,
    provider: params.momoProvider,
    idempotencyKey,
  });

  await supabaseAdmin.from("cart_items").delete().eq("cart_id", cart.id);

  return {
    orderId: order.id,
    paymentReference: idempotencyKey,
    displayText: charge.data?.display_text,
  };
}

export async function handlePaystackWebhook(
  rawBody: string,
  signature: string | null,
): Promise<{ ok: boolean; message: string }> {
  if (!verifyPaystackSignature(rawBody, signature)) {
    return { ok: false, message: "Invalid signature" };
  }

  const event = JSON.parse(rawBody) as {
    event: string;
    data: { reference: string; status: string; amount: number };
  };

  if (event.event !== "charge.success") {
    return { ok: true, message: "Ignored event" };
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const reference = event.data.reference;

  const { data: payment } = await supabaseAdmin
    .from("payments")
    .select("*, order:orders(*)")
    .eq("idempotency_key", reference)
    .maybeSingle();

  if (!payment) return { ok: false, message: "Payment not found" };
  if (payment.status === "paid") return { ok: true, message: "Already processed" };

  await supabaseAdmin
    .from("payments")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", payment.id);
  await supabaseAdmin
    .from("orders")
    .update({ status: "confirmed", payment_status: "paid", updated_at: new Date().toISOString() })
    .eq("id", payment.order_id);

  const order = payment.order as { buyer_id: string };
  await supabaseAdmin.from("notifications").insert({
    user_id: order.buyer_id,
    type: "order_confirmed",
    title: "Payment confirmed",
    body: "Your order is confirmed. A driver will be assigned shortly.",
    link: `/app/buyer/orders`,
  });

  await supabaseAdmin.from("audit_log").insert({
    action: "payment_confirmed",
    entity_type: "payment",
    entity_id: payment.id,
    metadata: { reference, amount: event.data.amount },
  });

  const { data: delivery } = await supabaseAdmin
    .from("deliveries")
    .select("id, pickup_address, delivery_fee")
    .eq("order_id", payment.order_id)
    .maybeSingle();

  if (delivery) {
    const { notifyDriversOfNewJob } = await import("@/server/push");
    await notifyDriversOfNewJob(
      delivery.id,
      delivery.pickup_address,
      Number(delivery.delivery_fee ?? 0),
    );
  }

  return { ok: true, message: "Payment processed" };
}
