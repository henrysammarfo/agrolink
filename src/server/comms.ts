/** Central notifications + web push delivery (VAPID) + FCM fallback */

import webpush from "web-push";

type NotifyPayload = {
  type: string;
  title: string;
  body?: string;
  link?: string;
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

export async function notifyUser(userId: string, payload: NotifyPayload) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    type: payload.type,
    title: payload.title,
    body: payload.body ?? null,
    link: payload.link ?? null,
  });

  const { data: tokens } = await supabaseAdmin
    .from("push_tokens")
    .select("token, platform")
    .eq("user_id", userId);

  const fcmKey = process.env.FCM_SERVER_KEY;
  ensureVapid();

  for (const row of tokens ?? []) {
    if (row.platform === "web") {
      await sendWebPush(row.token, payload).catch((e) =>
        console.warn("[WebPush] failed", e),
      );
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
      headers: {
        Authorization: `key=${serverKey}`,
        "Content-Type": "application/json",
      },
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
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: drivers } = await supabaseAdmin
    .from("driver_profiles")
    .select("user_id")
    .eq("verification_status", "approved")
    .eq("available", true);

  const title = "New delivery job";
  const body = `${pickupAddress} · GHS ${feeGhs.toFixed(0)} payout — tap to accept`;
  const link = "/app/transport/jobs";

  for (const d of drivers ?? []) {
    await notifyUser(d.user_id, { type: "delivery_job", title, body, link });
  }

  await supabaseAdmin.from("audit_log").insert({
    action: "driver_job_broadcast",
    entity_type: "delivery",
    entity_id: deliveryId,
    metadata: { driver_count: drivers?.length ?? 0, fee: feeGhs },
  });
}

export async function sendChatMessageServer(opts: {
  senderId: string;
  receiverId: string;
  content: string;
  orderId?: string;
  senderName?: string;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: msg, error } = await supabaseAdmin
    .from("messages")
    .insert({
      sender_id: opts.senderId,
      receiver_id: opts.receiverId,
      content: opts.content.trim(),
      order_id: opts.orderId ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;

  const preview = opts.content.length > 80 ? `${opts.content.slice(0, 80)}…` : opts.content;
  await notifyUser(opts.receiverId, {
    type: "message",
    title: opts.senderName ? `Message from ${opts.senderName}` : "New message",
    body: preview,
    link: `/app/inbox/chat/${opts.senderId}${opts.orderId ? `?order=${opts.orderId}` : ""}`,
  });

  return msg.id as string;
}
