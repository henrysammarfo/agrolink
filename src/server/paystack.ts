import crypto from "node:crypto";
import { getSiteOrigin } from "@/lib/auth-redirect";

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

export type PaystackInitResult = {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

export async function initializePaystackTransaction(params: {
  amount: number;
  email: string;
  reference: string;
  callbackUrl: string;
  subaccount?: string;
  transactionChargeGhs?: number;
}): Promise<PaystackInitResult> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return {
      status: true,
      message: "Demo mode",
      data: {
        authorization_url: params.callbackUrl,
        access_code: "demo",
        reference: params.reference,
      },
    };
  }

  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(params.amount * 100),
      email: params.email,
      currency: "GHS",
      reference: params.reference,
      callback_url: params.callbackUrl,
      channels: ["mobile_money", "card"],
      ...(params.subaccount
        ? {
            subaccount: params.subaccount,
            transaction_charge: Math.round((params.transactionChargeGhs ?? 0) * 100),
            bearer: "account",
          }
        : {}),
    }),
  });

  return res.json() as Promise<PaystackInitResult>;
}

export async function initiatePaystackMoMoCharge(params: {
  amount: number;
  email: string;
  phone: string;
  provider: "mtn" | "vod" | "atl";
  idempotencyKey: string;
  subaccount?: string;
  transactionChargeGhs?: number;
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
      ...(params.subaccount
        ? {
            subaccount: params.subaccount,
            transaction_charge: Math.round((params.transactionChargeGhs ?? 0) * 100),
            bearer: "account",
          }
        : {}),
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
  fulfillmentMode?: "platform_delivery" | "farm_pickup" | "own_driver";
  otpVerified?: boolean;
  vehicleType?: "bicycle" | "motorcycle" | "car";
}): Promise<{
  orderId: string;
  paymentReference: string;
  authorizationUrl?: string;
  displayText?: string;
  demoMode?: boolean;
  paymentConfirmed?: boolean;
}> {
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

  for (const it of items) {
    const listing = it.listing as { id: string; quantity: number; status: string; title: string; unit: string };
    if (listing.status !== "active") {
      throw new Error(`${listing.title ?? "An item"} is no longer available.`);
    }
    if (Number(listing.quantity) < Number(it.quantity)) {
      throw new Error(
        Number(listing.quantity) <= 0
          ? `${listing.title ?? "An item"} is sold out.`
          : `Only ${listing.quantity} ${listing.unit} left for ${listing.title ?? "an item"}.`,
      );
    }
  }

  const fulfillmentMode = params.fulfillmentMode ?? "platform_delivery";
  const needsDelivery = fulfillmentMode === "platform_delivery";

  const subtotal = items.reduce((s, it) => {
    const listing = it.listing as { price_per_unit: number };
    return s + Number(listing.price_per_unit) * Number(it.quantity);
  }, 0);

  const listings = items.map((it) => {
    const l = it.listing as {
      lat: number;
      lng: number;
      location_name: string;
      unit: string;
      seller_id: string;
    };
    return l;
  });
  const firstListing = listings[0];
  const weightKg = items.reduce((s, it) => s + Number(it.quantity), 0);
  const deliveryLat = needsDelivery ? (params.deliveryLat ?? firstListing.lat + 0.05) : firstListing.lat;
  const deliveryLng = needsDelivery ? (params.deliveryLng ?? firstListing.lng + 0.05) : firstListing.lng;

  const pickupStops = [
    ...new Map(
      listings.map((l) => [
        `${l.lat},${l.lng}`,
        { lat: l.lat, lng: l.lng, label: l.location_name },
      ]),
    ).values(),
  ];

  let deliveryFee = 0;
  let quote = {
    total: 0,
    distanceKm: 0,
    breakdown: [] as string[],
    baseFare: 0,
    peakMultiplier: 1,
    vehicleMultiplier: 1,
    pricingConfig: { platform_fee_pct: 0.06 },
    orderedStops: pickupStops,
  };

  if (needsDelivery) {
    const { computeDeliveryQuote } = await import("@/server/delivery-quote");
    const quoteVehicle =
      params.vehicleType === "car"
        ? "pickup"
        : params.vehicleType === "bicycle"
          ? "motorcycle"
          : weightKg > 80
            ? "truck"
            : weightKg > 40
              ? "pickup"
              : "motorcycle";
    quote = await computeDeliveryQuote({
      pickupLat: firstListing.lat,
      pickupLng: firstListing.lng,
      deliveryLat,
      deliveryLng,
      weightKg,
      vehicleType: quoteVehicle,
      pickupStops: pickupStops.length > 1 ? pickupStops : undefined,
    });
    if (params.vehicleType === "bicycle") {
      quote = { ...quote, total: Math.round(quote.total * 0.85) };
    }
    deliveryFee = quote.total;
  }

  const platformFee = Math.round(subtotal * quote.pricingConfig.platform_fee_pct * 100) / 100;
  const total = subtotal + deliveryFee + platformFee;
  const feeBreakdown = {
    fulfillmentMode,
    distanceKm: quote.distanceKm,
    breakdown: quote.breakdown,
    baseFare: quote.baseFare,
    peakMultiplier: quote.peakMultiplier,
    vehicleMultiplier: quote.vehicleMultiplier,
    pickupStops: quote.orderedStops ?? pickupStops,
  };

  const { requireOtpForCheckout } = await import("@/server/checkout-otp");
  if (await requireOtpForCheckout(params.userId, total)) {
    if (!params.otpVerified) {
      throw new Error("SMS verification required for orders over GHS 500");
    }
  }

  const primarySellerId = (items[0].listing as { seller_id: string }).seller_id;
  const { buildEscrowSplit } = await import("@/server/paystack-subaccounts");
  const escrowSplit = await buildEscrowSplit({
    sellerId: primarySellerId,
    subtotalGhs: subtotal,
    platformFeePct: quote.pricingConfig.platform_fee_pct,
  });

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
      delivery_address: needsDelivery ? (params.deliveryAddress ?? null) : `Pickup: ${firstListing.location_name}`,
      delivery_lat: deliveryLat,
      delivery_lng: deliveryLng,
      notes: fulfillmentMode,
      escrow_status: escrowSplit ? "held" : "pending",
      escrow_amount: escrowSplit?.farmerShareGhs ?? null,
      otp_verified_at: params.otpVerified ? new Date().toISOString() : null,
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

  for (const it of items) {
    const listing = it.listing as { id: string; quantity: number };
    const remaining = Math.max(0, Number(listing.quantity) - Number(it.quantity));
    await supabaseAdmin
      .from("listings")
      .update({
        quantity: remaining,
        status: remaining <= 0 ? "sold_out" : "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", listing.id);
  }

  if (needsDelivery) {
    const { acceptDeadlineFromNow } = await import("@/server/delivery-reassign");
    const { radiusForOfferRound } = await import("@/lib/vehicle-types");
    const vehicleType =
      params.vehicleType === "bicycle"
        ? "bicycle"
        : params.vehicleType === "car"
          ? "pickup"
          : weightKg > 80
            ? "truck"
            : weightKg > 40
              ? "pickup"
              : weightKg > 15
                ? "motorcycle"
                : "bicycle";
    await supabaseAdmin.from("deliveries").insert({
      order_id: order.id,
      pickup_lat: firstListing.lat,
      pickup_lng: firstListing.lng,
      pickup_address:
        pickupStops.length > 1
          ? `${pickupStops.length} farms · ${firstListing.location_name}`
          : firstListing.location_name,
      delivery_lat: deliveryLat,
      delivery_lng: deliveryLng,
      delivery_address: params.deliveryAddress ?? "Buyer address",
      estimated_distance_km: quote.distanceKm,
      delivery_fee: deliveryFee,
      fee_breakdown: feeBreakdown,
      pickup_stops: quote.orderedStops ?? pickupStops,
      accept_deadline: acceptDeadlineFromNow(),
      required_vehicle_type: vehicleType,
      search_radius_km: radiusForOfferRound(1),
      offer_round: 1,
      declined_driver_ids: [],
      status: "requested",
    });
  }

  await supabaseAdmin.from("payments").insert({
    order_id: order.id,
    provider: "paystack",
    amount: total,
    status: "pending",
    idempotency_key: idempotencyKey,
    provider_reference: idempotencyKey,
    escrow_status: escrowSplit ? "held" : null,
    paystack_split: escrowSplit
      ? {
          subaccount: escrowSplit.subaccountCode,
          farmer_share: escrowSplit.farmerShareGhs,
          platform_share: escrowSplit.platformShareGhs,
        }
      : null,
  });

  const siteOrigin = getSiteOrigin() || process.env.SITE_URL || process.env.VITE_SITE_URL || "https://agrolink-omega.vercel.app";
  const callbackUrl = `${siteOrigin.replace(/\/$/, "")}/app/buyer/orders/${order.id}/payment-callback`;

  const init = await initializePaystackTransaction({
    amount: total,
    email: params.email,
    reference: idempotencyKey,
    callbackUrl,
    subaccount: escrowSplit?.subaccountCode,
    transactionChargeGhs: escrowSplit
      ? escrowSplit.platformShareGhs + deliveryFee + platformFee
      : undefined,
  });

  await supabaseAdmin.from("cart_items").delete().eq("cart_id", cart.id);

  const demoMode = !process.env.PAYSTACK_SECRET_KEY;
  let paymentConfirmed = false;

  if (demoMode) {
    const confirmed = await confirmOrderPayment(idempotencyKey);
    paymentConfirmed = confirmed.ok;
  }

  return {
    orderId: order.id,
    paymentReference: idempotencyKey,
    authorizationUrl: init.data?.authorization_url,
    displayText: demoMode
      ? "Demo payment confirmed — finding your driver."
      : "Complete payment on Paystack to confirm your order.",
    demoMode,
    paymentConfirmed,
  };
}

export async function confirmOrderPayment(reference: string): Promise<{ ok: boolean; message: string; orderId?: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: payment } = await supabaseAdmin
    .from("payments")
    .select("*, order:orders(*)")
    .eq("idempotency_key", reference)
    .maybeSingle();

  if (!payment) return { ok: false, message: "Payment not found" };
  if (payment.status === "paid") {
    await maybeNotifyDriversForPaidOrder(payment.order_id);
    return { ok: true, message: "Already processed", orderId: payment.order_id };
  }

  await supabaseAdmin
    .from("payments")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", payment.id);
  await supabaseAdmin
    .from("orders")
    .update({ status: "confirmed", payment_status: "paid", updated_at: new Date().toISOString() })
    .eq("id", payment.order_id);

  const order = payment.order as { buyer_id: string; notes?: string | null };
  const { notifyUser } = await import("@/server/comms");
  const isPickup = order.notes === "farm_pickup" || order.notes === "own_driver";
  await notifyUser(order.buyer_id, {
    type: "order_confirmed",
    title: "Payment confirmed",
    body: isPickup
      ? "Your order is confirmed. Pickup details are in your orders."
      : "Your order is confirmed. A driver will be assigned shortly.",
    link: "/app/buyer/orders",
  });

  await supabaseAdmin.from("audit_log").insert({
    action: "payment_confirmed",
    entity_type: "payment",
    entity_id: payment.id,
    metadata: { reference },
  });

  await maybeNotifyDriversForPaidOrder(payment.order_id);

  return { ok: true, message: "Payment processed", orderId: payment.order_id };
}

async function maybeNotifyDriversForPaidOrder(orderId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: delivery } = await supabaseAdmin
    .from("deliveries")
    .select("id, pickup_address, delivery_fee, status, driver_id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (!delivery || delivery.status !== "requested" || delivery.driver_id) return;

  const { notifyDriversOfNewJob } = await import("@/server/push");
  const { setDeliveryAcceptDeadline } = await import("@/server/delivery-reassign");
  await setDeliveryAcceptDeadline(delivery.id);
  await notifyDriversOfNewJob(
    delivery.id,
    delivery.pickup_address,
    Number(delivery.delivery_fee ?? 0),
  );
}

export async function verifyAndConfirmPayment(reference: string): Promise<{ ok: boolean; message: string; orderId?: string }> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return confirmOrderPayment(reference);
  }

  const verify = await verifyPaystackTransaction(reference);
  const status = (verify as { data?: { status?: string } }).data?.status;
  if (status !== "success") {
    return { ok: false, message: "Payment not completed yet" };
  }

  return confirmOrderPayment(reference);
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

  const result = await confirmOrderPayment(event.data.reference);
  return { ok: result.ok, message: result.message };
}
