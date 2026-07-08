/** Central notifications — in-app + web push + free email (Resend) + Meta WhatsApp */

import webpush from "web-push";
import { sendOrderEmail } from "@/server/email-notify";
import { sendWhatsAppMessage, orderStatusWhatsAppBody } from "@/server/whatsapp";

type NotifyPayload = {
  type: string;
  title: string;
  body?: string;
  link?: string;
  whatsappExtras?: Record<string, string>;
};

let vapidReady = false;

function ensureVapid() {
  if (vapidReady) return;
  const pub = process.env.VITE_VAPID_PUBLIC_KEY ?? process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:support@agrolink.app";
  if (pub && priv) {
    webpush.setVapidDetails(subject, pub, priv);
    vapidReady = true;
  }
}

function absoluteLink(link?: string): string | undefined {
  if (!link) return undefined;
  const site = process.env.SITE_URL ?? process.env.VITE_SITE_URL ?? "https://agrolink.app";
  return link.startsWith("http") ? link : `${site.replace(/\/$/, "")}${link}`;
}

export async function notifyUser(userId: string, payload: NotifyPayload) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    type: payload.type,
    title: payload.title,
    body: payload.body ?? null,
    link: payload.link ?? null,
  });

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("phone, whatsapp_enabled, push_enabled")
    .eq("id", userId)
    .maybeSingle();

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId).catch(() => ({
    data: { user: null },
  }));
  const email = authUser?.user?.email;

  const orderUpdatesEnabled = profile?.whatsapp_enabled !== false;
  const fullLink = absoluteLink(payload.link);

  if (orderUpdatesEnabled) {
    if (email) {
      await sendOrderEmail({
        to: email,
        subject: payload.title,
        title: payload.title,
        body: payload.body ?? payload.title,
        link: fullLink,
      });
    }

    if (profile?.phone) {
      const waBody = orderStatusWhatsAppBody(payload.type, {
        body: payload.body ?? payload.title,
        link: payload.link ?? "",
        preview: payload.body ?? payload.title,
        ...payload.whatsappExtras,
      });
      await sendWhatsAppMessage(profile.phone, waBody);
    }
  }

  if (profile?.push_enabled === false) return;

  const { data: tokens } = await supabaseAdmin
    .from("push_tokens")
    .select("token, platform")
    .eq("user_id", userId);

  const fcmKey = process.env.FCM_SERVER_KEY;
  ensureVapid();

  for (const row of tokens ?? []) {
    if (row.platform === "web") {
      await sendWebPush(row.token, payload).catch((e) => console.warn("[WebPush] failed", e));
    } else if (fcmKey) {
      await sendFcm(row.token, payload.title, payload.body ?? "", payload.link, fcmKey);
    }
  }
}

async function sendWebPush(storedToken: string, payload: NotifyPayload) {
  ensureVapid();
  if (!vapidReady) return;
  let subscription: webpush.PushSubscription;
  try {
    subscription = JSON.parse(storedToken) as webpush.PushSubscription;
  } catch {
    return;
  }
  await webpush.sendNotification(
    subscription,
    JSON.stringify({
      title: payload.title,
      body: payload.body ?? "",
      link: payload.link ?? "/app/inbox",
    }),
  );
}

async function sendFcm(
  token: string,
  title: string,
  body: string,
  link: string | undefined,
  serverKey: string,
) {
  try {
    await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: { Authorization: `key=${serverKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        to: token,
        notification: { title, body },
        data: { link: link ?? "/app/inbox" },
      }),
    });
  } catch (e) {
    console.warn("[FCM] send failed", e);
  }
}

export async function notifyDriversOfNewJob(
  deliveryId: string,
  pickupAddress: string,
  feeGhs: number,
) {
  const { notifyEligibleDriversForDelivery } = await import("@/server/driver-matching");
  const count = await notifyEligibleDriversForDelivery(deliveryId);
  if (count === 0) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("audit_log").insert({
      action: "driver_job_no_match",
      entity_type: "delivery",
      entity_id: deliveryId,
      metadata: { pickup: pickupAddress, fee: feeGhs },
    });
  }
}

export async function sendChatMessageServer(opts: {
  senderId: string;
  receiverId: string;
  content: string;
  orderId?: string;
  deliveryId?: string;
  senderName?: string;
  attachmentUrl?: string;
  attachmentType?: "image" | "video";
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const {
    canSendDirectMessage,
    createMessageRequest,
    hasActiveDeliveryChat,
  } = await import("@/server/message-permissions");

  const text = opts.content.trim() || (opts.attachmentUrl ? "📷 Photo" : "");
  if (!text && !opts.attachmentUrl) throw new Error("Empty message");

  const permission = await canSendDirectMessage(opts.senderId, opts.receiverId, {
    orderId: opts.orderId,
    deliveryId: opts.deliveryId,
  });

  if (!permission.allowed) {
    if (permission.needsRequest) {
      await createMessageRequest(opts.senderId, opts.receiverId, text);
      return "request_pending";
    }
    throw new Error(permission.reason ?? "Cannot send message");
  }

  let resolvedDeliveryId = opts.deliveryId ?? null;
  if (!resolvedDeliveryId && opts.orderId) {
    const trip = await hasActiveDeliveryChat(opts.senderId, opts.receiverId, opts.orderId);
    if (trip) {
      const { data: d } = await supabaseAdmin
        .from("deliveries")
        .select("id")
        .eq("order_id", opts.orderId)
        .maybeSingle();
      resolvedDeliveryId = d?.id ?? null;
    }
  }

  const { data: msg, error } = await supabaseAdmin
    .from("messages")
    .insert({
      sender_id: opts.senderId,
      receiver_id: opts.receiverId,
      content: text,
      order_id: opts.orderId ?? null,
      delivery_id: resolvedDeliveryId,
      attachment_url: opts.attachmentUrl ?? null,
      attachment_type: opts.attachmentType ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;

  const preview = opts.attachmentUrl ? "Sent a photo" : text.slice(0, 80);
  const tripSuffix = resolvedDeliveryId ? `&delivery=${resolvedDeliveryId}` : "";
  await notifyUser(opts.receiverId, {
    type: "message",
    title: opts.senderName ? `Message from ${opts.senderName}` : "New message",
    body: preview,
    link: `/app/inbox/chat/${opts.senderId}${opts.orderId ? `?order=${opts.orderId}` : ""}${tripSuffix}`,
    whatsappExtras: { preview },
  });

  return msg.id as string;
}
