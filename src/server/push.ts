/** FCM + in-app notifications for driver job offers (Bolt/Yango-style ping) */

export async function registerPushToken(userId: string, token: string, platform: "web" | "android" | "ios") {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("push_tokens").upsert(
    { user_id: userId, token, platform, updated_at: new Date().toISOString() },
    { onConflict: "user_id,token" },
  );
}

export async function sendPushToUser(userId: string, title: string, body: string, link?: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    type: "push",
    title,
    body,
    link: link ?? null,
  });

  const { data: tokens } = await supabaseAdmin
    .from("push_tokens")
    .select("token, platform")
    .eq("user_id", userId);

  const fcmKey = process.env.FCM_SERVER_KEY;
  for (const row of tokens ?? []) {
    if (fcmKey && row.platform !== "web") {
      await sendFcm(row.token, title, body, link, fcmKey);
    }
  }
}

async function sendFcm(token: string, title: string, body: string, link: string | undefined, serverKey: string) {
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
        data: { link: link ?? "/app/transport" },
      }),
    });
  } catch (e) {
    console.warn("[FCM] send failed", e);
  }
}

/** Notify verified online drivers of a new delivery job */
export async function notifyDriversOfNewJob(deliveryId: string, pickupAddress: string, feeGhs: number) {
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
    await sendPushToUser(d.user_id, title, body, link);
  }

  await supabaseAdmin.from("audit_log").insert({
    action: "driver_job_broadcast",
    entity_type: "delivery",
    entity_id: deliveryId,
    metadata: { driver_count: drivers?.length ?? 0, fee: feeGhs },
  });
}
