import crypto from "node:crypto";

import { HIGH_VALUE_OTP_THRESHOLD_GHS } from "@/lib/delivery-constants";
import { sendOtpEmail } from "@/server/email-notify";

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
  email?: string;
  orderTotalGhs: number;
}): Promise<{ ok: boolean; message: string; demoCode?: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  if (params.orderTotalGhs < HIGH_VALUE_OTP_THRESHOLD_GHS) {
    return { ok: true, message: "OTP not required for this order amount" };
  }

  const code = generateOtp();
  const phone = params.phone.replace(/\D/g, "").replace(/^233/, "0");

  let email = params.email?.trim();
  if (!email) {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(params.userId);
    email = authUser?.user?.email ?? undefined;
  }

  await supabaseAdmin.from("otp_sessions").insert({
    user_id: params.userId,
    phone,
    code_hash: hashCode(code),
    purpose: "checkout",
    amount_threshold: HIGH_VALUE_OTP_THRESHOLD_GHS,
    expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
  });

  if (!email) {
    return {
      ok: true,
      message: "Demo OTP (add email to account for free email verification)",
      demoCode: code,
    };
  }

  const sent = await sendOtpEmail({
    to: email,
    code,
    orderTotalGhs: params.orderTotalGhs,
  });

  if (sent.ok) {
    return { ok: true, message: "Verification code sent to your email (free via Resend)" };
  }

  if (!process.env.RESEND_API_KEY) {
    return {
      ok: true,
      message: "Demo OTP (set RESEND_API_KEY for free email delivery)",
      demoCode: code,
    };
  }

  return { ok: false, message: "Could not send email — try again" };
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

  await supabaseAdmin.from("otp_sessions").update({ verified: true }).eq("id", session.id);

  await supabaseAdmin
    .from("profiles")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", params.userId);

  return { ok: true, message: "Email verified" };
}

export async function requireOtpForCheckout(userId: string, totalGhs: number): Promise<boolean> {
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
