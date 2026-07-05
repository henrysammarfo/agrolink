import crypto from "node:crypto";

import { HIGH_VALUE_OTP_THRESHOLD_GHS } from "@/lib/delivery-constants";

export { HIGH_VALUE_OTP_THRESHOLD_GHS };

const OTP_TTL_MS = 10 * 60 * 1000;

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendCheckoutOtp(params: {
  userId: string;
  phone: string;
  orderTotalGhs: number;
}): Promise<{ ok: boolean; message: string; demoCode?: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  if (params.orderTotalGhs < HIGH_VALUE_OTP_THRESHOLD_GHS) {
    return { ok: true, message: "OTP not required for this order amount" };
  }

  const code = generateOtp();
  const phone = params.phone.replace(/\D/g, "").replace(/^233/, "0");
  const message = `AgroLink: Your verification code is ${code}. Valid for 10 minutes. Do not share.`;

  const clientId = process.env.HUBTEL_CLIENT_ID;
  const clientSecret = process.env.HUBTEL_CLIENT_SECRET;

  let sent = false;
  if (clientId && clientSecret) {
    try {
      const qs = new URLSearchParams({
        ClientId: clientId,
        ClientSecret: clientSecret,
        From: "AgroLink",
        To: phone.startsWith("0") ? `+233${phone.slice(1)}` : phone,
        Content: message,
      });
      const res = await fetch(`https://smsc.hubtel.com/v1/messages/send?${qs.toString()}`);
      sent = res.ok;
    } catch (e) {
      console.warn("[HubtelSMS]", e);
    }
  }

  await supabaseAdmin.from("otp_sessions").insert({
    user_id: params.userId,
    phone,
    code_hash: hashCode(code),
    purpose: "checkout",
    amount_threshold: HIGH_VALUE_OTP_THRESHOLD_GHS,
    expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
  });

  if (!clientId || !clientSecret) {
    return {
      ok: true,
      message: "Demo OTP sent (Hubtel keys not configured)",
      demoCode: code,
    };
  }

  return sent
    ? { ok: true, message: "Verification code sent via SMS" }
    : { ok: false, message: "Could not send SMS — try again" };
}

export async function verifyCheckoutOtp(params: {
  userId: string;
  code: string;
}): Promise<{ ok: boolean; message: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: session } = await supabaseAdmin
    .from("otp_sessions")
    .select("*")
    .eq("user_id", params.userId)
    .eq("purpose", "checkout")
    .eq("verified", false)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!session) {
    return { ok: false, message: "No active verification — request a new code" };
  }

  if (hashCode(params.code.trim()) !== session.code_hash) {
    return { ok: false, message: "Invalid code" };
  }

  await supabaseAdmin
    .from("otp_sessions")
    .update({ verified: true })
    .eq("id", session.id);

  await supabaseAdmin
    .from("profiles")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", params.userId);

  return { ok: true, message: "Phone verified" };
}

export async function requireOtpForCheckout(
  userId: string,
  totalGhs: number,
): Promise<boolean> {
  if (totalGhs < HIGH_VALUE_OTP_THRESHOLD_GHS) return false;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("otp_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("purpose", "checkout")
    .eq("verified", true)
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();

  return !data;
}
