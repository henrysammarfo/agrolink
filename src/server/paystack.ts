import crypto from "node:crypto";
import { getSiteOrigin } from "@/lib/auth-redirect";
import { buyerVehicleToRequired } from "@/lib/vehicle-types";

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
    const vehicleType = buyerVehicleToRequired(params.vehicleType);
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
  const callbackUrl = `${siteOrigin.replace(/\/$/, "")}/app/buyer/orders/${order.id}/payment-callback?reference=${encodeURIComponent(idempotencyKey)}`;

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

/** Create pending order + delivery, notify drivers — payment happens after driver accepts. */
export async function reserveOrderForDriverMatch(params: {
  userId: string;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  vehicleType?: "bicycle" | "motorcycle" | "car";
  otpVerified?: boolean;
}): Promise<{ orderId: string; deliveryId: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { notifyEligibleDriversForDelivery } = await import("@/server/driver-matching");

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
    if (listing.status !== "active") throw new Error(`${listing.title ?? "An item"} is no longer available.`);
    if (Number(listing.quantity) < Number(it.quantity)) {
      throw new Error(`Only ${listing.quantity} ${listing.unit} left for ${listing.title ?? "an item"}.`);
    }
  }

  const subtotal = items.reduce((s, it) => {
    const listing = it.listing as { price_per_unit: number };
    return s + Number(listing.price_per_unit) * Number(it.quantity);
  }, 0);

  const listings = items.map((it) => it.listing as { lat: number; lng: number; location_name: string; seller_id: string; price_per_unit: number; id: string; quantity: number; unit: string; status: string; title: string });
  const firstListing = listings[0];
  const weightKg = items.reduce((s, it) => s + Number(it.quantity), 0);
  const deliveryLat = params.deliveryLat ?? firstListing.lat + 0.05;
  const deliveryLng = params.deliveryLng ?? firstListing.lng + 0.05;

  const pickupStops = [
    ...new Map(listings.map((l) => [`${l.lat},${l.lng}`, { lat: l.lat, lng: l.lng, label: l.location_name }])).values(),
  ];

  const { computeDeliveryQuote } = await import("@/server/delivery-quote");
  const quoteVehicle = params.vehicleType === "car" ? "pickup" : "motorcycle";
  let quote = await computeDeliveryQuote({
    pickupLat: firstListing.lat,
    pickupLng: firstListing.lng,
    deliveryLat,
    deliveryLng,
    weightKg,
    vehicleType: quoteVehicle,
    pickupStops: pickupStops.length > 1 ? pickupStops : undefined,
  });
  if (params.vehicleType === "bicycle") quote = { ...quote, total: Math.round(quote.total * 0.85) };

  const deliveryFee = quote.total;
  const platformFee = Math.round(subtotal * quote.pricingConfig.platform_fee_pct * 100) / 100;
  const total = subtotal + deliveryFee + platformFee;

  const { requireOtpForCheckout } = await import("@/server/checkout-otp");
  if (await requireOtpForCheckout(params.userId, total)) {
    if (!params.otpVerified) throw new Error("SMS verification required for orders over GHS 500");
  }

  const primarySellerId = firstListing.seller_id;
  const { buildEscrowSplit } = await import("@/server/paystack-subaccounts");
  const escrowSplit = await buildEscrowSplit({
    sellerId: primarySellerId,
    subtotalGhs: subtotal,
    platformFeePct: quote.pricingConfig.platform_fee_pct,
  });

  const feeBreakdown = {
    fulfillmentMode: "platform_delivery",
    distanceKm: quote.distanceKm,
    breakdown: quote.breakdown,
    baseFare: quote.baseFare,
    peakMultiplier: quote.peakMultiplier,
    vehicleMultiplier: quote.vehicleMultiplier,
    pickupStops: quote.orderedStops ?? pickupStops,
  };

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
      notes: "platform_delivery",
      escrow_status: escrowSplit ? "held" : "pending",
      escrow_amount: escrowSplit?.farmerShareGhs ?? null,
      otp_verified_at: params.otpVerified ? new Date().toISOString() : null,
    })
    .select()
    .single();
  if (orderErr) throw orderErr;

  await supabaseAdmin.from("order_items").insert(
    items.map((it) => {
      const listing = it.listing as { id: string; seller_id: string; price_per_unit: number };
      return {
        order_id: order.id,
        listing_id: listing.id,
        seller_id: listing.seller_id,
        quantity: it.quantity,
        unit_price: listing.price_per_unit,
        total_price: Number(listing.price_per_unit) * Number(it.quantity),
      };
    }),
  );

  for (const it of items) {
    const listing = it.listing as { id: string; quantity: number };
    const remaining = Math.max(0, Number(listing.quantity) - Number(it.quantity));
    await supabaseAdmin.from("listings").update({
      quantity: remaining,
      status: remaining <= 0 ? "sold_out" : "active",
      updated_at: new Date().toISOString(),
    }).eq("id", listing.id);
  }

  const { acceptDeadlineFromNow } = await import("@/server/delivery-reassign");
  const { radiusForOfferRound } = await import("@/lib/vehicle-types");
  const vehicleType = buyerVehicleToRequired(params.vehicleType);

  const { data: delivery, error: delErr } = await supabaseAdmin
    .from("deliveries")
    .insert({
      order_id: order.id,
      pickup_lat: firstListing.lat,
      pickup_lng: firstListing.lng,
      pickup_address: pickupStops.length > 1 ? `${pickupStops.length} farms · ${firstListing.location_name}` : firstListing.location_name,
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
    })
    .select("id")
    .single();
  if (delErr) throw delErr;

  await supabaseAdmin.from("cart_items").delete().eq("cart_id", cart.id);

  await notifyEligibleDriversForDelivery(delivery.id);

  return { orderId: order.id, deliveryId: delivery.id };
}

/** Start payment for a reserved order — requires driver assigned first. */
export async function initiatePaymentForOrder(params: {
  userId: string;
  orderId: string;
  email: string;
  phone: string;
  momoProvider: "mtn" | "vod" | "atl";
}): Promise<{
  orderId: string;
  paymentReference: string;
  authorizationUrl?: string;
  displayText?: string;
  demoMode?: boolean;
  paymentConfirmed?: boolean;
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("*, delivery:deliveries(id, driver_id, status)")
    .eq("id", params.orderId)
    .eq("buyer_id", params.userId)
    .maybeSingle();

  if (!order) throw new Error("Order not found");
  if (order.payment_status === "paid") throw new Error("Order already paid");

  const isPlatform = order.notes === "platform_delivery";
  const delivery = order.delivery as { id: string; driver_id: string | null; status: string } | { id: string; driver_id: string | null; status: string }[] | null;
  const deliveryRow = Array.isArray(delivery) ? delivery[0] : delivery;

  if (isPlatform && !deliveryRow?.driver_id) {
    throw new Error("A driver must accept your trip before you can pay");
  }

  const { data: existingPayment } = await supabaseAdmin
    .from("payments")
    .select("id, idempotency_key")
    .eq("order_id", params.orderId)
    .maybeSingle();

  const idempotencyKey = existingPayment?.idempotency_key ?? `agrolink-${params.userId.slice(0, 8)}-${Date.now()}`;
  const total = Number(order.total_amount);

  if (!existingPayment) {
    const primarySellerId = (await supabaseAdmin.from("order_items").select("seller_id").eq("order_id", params.orderId).limit(1).maybeSingle()).data?.seller_id;
    const { buildEscrowSplit } = await import("@/server/paystack-subaccounts");
    const escrowSplit = primarySellerId
      ? await buildEscrowSplit({ sellerId: primarySellerId, subtotalGhs: Number(order.subtotal), platformFeePct: 0.06 })
      : null;

    await supabaseAdmin.from("payments").insert({
      order_id: params.orderId,
      provider: "paystack",
      amount: total,
      status: "pending",
      idempotency_key: idempotencyKey,
      provider_reference: idempotencyKey,
      escrow_status: escrowSplit ? "held" : null,
      paystack_split: escrowSplit
        ? { subaccount: escrowSplit.subaccountCode, farmer_share: escrowSplit.farmerShareGhs, platform_share: escrowSplit.platformShareGhs }
        : null,
    });
  }

  const siteOrigin = getSiteOrigin() || process.env.SITE_URL || process.env.VITE_SITE_URL || "https://agrolink-omega.vercel.app";
  const callbackUrl = `${siteOrigin.replace(/\/$/, "")}/app/buyer/orders/${params.orderId}/payment-callback?reference=${encodeURIComponent(idempotencyKey)}`;

  const init = await initializePaystackTransaction({
    amount: total,
    email: params.email,
    reference: idempotencyKey,
    callbackUrl,
  });

  const demoMode = !process.env.PAYSTACK_SECRET_KEY;
  let paymentConfirmed = false;
  if (demoMode) {
    const confirmed = await confirmOrderPayment(idempotencyKey);
    paymentConfirmed = confirmed.ok;
  }

  return {
    orderId: params.orderId,
    paymentReference: idempotencyKey,
    authorizationUrl: init.data?.authorization_url,
    displayText: demoMode ? "Demo payment confirmed — your driver is ready." : "Complete payment on Paystack to confirm your order.",
    demoMode,
    paymentConfirmed,
  };
}

/** Cancel unpaid reserved checkout — restores inventory and cart items. */
export async function cancelPendingCheckoutOrder(params: {
  userId: string;
  orderId: string;
}): Promise<{ ok: true }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select(
      `
      *,
      delivery:deliveries(id, status, driver_id),
      items:order_items(*, listing:listings(id, quantity, status))
    `,
    )
    .eq("id", params.orderId)
    .eq("buyer_id", params.userId)
    .maybeSingle();

  if (!order) throw new Error("Order not found");
  if (order.payment_status === "paid") throw new Error("Cannot cancel a paid order");
  if (order.status === "cancelled") return { ok: true };

  const delivery = Array.isArray(order.delivery) ? order.delivery[0] : order.delivery;

  for (const item of order.items ?? []) {
    const listing = item.listing as { id: string; quantity: number; status: string } | null;
    if (!listing) continue;
    const restoredQty = Number(listing.quantity) + Number(item.quantity);
    await supabaseAdmin
      .from("listings")
      .update({
        quantity: restoredQty,
        status: restoredQty > 0 && listing.status === "sold_out" ? "active" : listing.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", listing.id);
  }

  let { data: cart } = await supabaseAdmin
    .from("carts")
    .select("id")
    .eq("user_id", params.userId)
    .maybeSingle();
  if (!cart) {
    const { data: created, error: cartErr } = await supabaseAdmin
      .from("carts")
      .insert({ user_id: params.userId })
      .select("id")
      .single();
    if (cartErr) throw cartErr;
    cart = created;
  }

  for (const item of order.items ?? []) {
    const listing = item.listing as { id: string } | null;
    if (!listing) continue;
    const { data: existing } = await supabaseAdmin
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", cart!.id)
      .eq("listing_id", listing.id)
      .maybeSingle();
    if (existing) {
      await supabaseAdmin
        .from("cart_items")
        .update({ quantity: Number(existing.quantity) + Number(item.quantity) })
        .eq("id", existing.id);
    } else {
      await supabaseAdmin.from("cart_items").insert({
        cart_id: cart!.id,
        listing_id: listing.id,
        quantity: item.quantity,
      });
    }
  }

  if (delivery?.id) {
    await supabaseAdmin
      .from("deliveries")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", delivery.id);
  }

  await supabaseAdmin
    .from("orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", params.orderId);

  return { ok: true };
}

export async function confirmOrderPayment(reference: string): Promise<{ ok: boolean; message: string; orderId?: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: paymentByKey } = await supabaseAdmin
    .from("payments")
    .select("*, order:orders(*)")
    .eq("idempotency_key", reference)
    .maybeSingle();

  let payment = paymentByKey;
  if (!payment) {
    const { data: paymentByRef } = await supabaseAdmin
      .from("payments")
      .select("*, order:orders(*)")
      .eq("provider_reference", reference)
      .maybeSingle();
    payment = paymentByRef;
  }

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

  // Farmers: SMS/WhatsApp sale alert (judges — phone-first, not email)
  const { data: soldItems } = await supabaseAdmin
    .from("order_items")
    .select("seller_id, listing:listings(title)")
    .eq("order_id", payment.order_id);
  const notifiedSellers = new Set<string>();
  for (const row of soldItems ?? []) {
    const sellerId = row.seller_id as string;
    if (!sellerId || notifiedSellers.has(sellerId)) continue;
    notifiedSellers.add(sellerId);
    const listing = row.listing as { title?: string } | null;
    await notifyUser(sellerId, {
      type: "farmer_sale",
      title: "New order for your produce",
      body: `A buyer ordered your ${listing?.title ?? "produce"}. Prepare for pickup.`,
      link: "/app/farmer/orders",
      whatsappExtras: { crop: listing?.title ?? "produce" },
    });
  }

  await supabaseAdmin.from("audit_log").insert({
    action: "payment_confirmed",
    entity_type: "payment",
    entity_id: payment.id,
    metadata: { reference },
  });

  await maybeNotifyDriversForPaidOrder(payment.order_id);

  return { ok: true, message: "Payment processed", orderId: payment.order_id };
}

export async function notifyDriversForPaidOrder(orderId: string) {
  return maybeNotifyDriversForPaidOrder(orderId);
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
