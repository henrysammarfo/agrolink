/** WhatsApp order updates — WATI primary, Hubtel SMS fallback when WhatsApp unavailable */

export type WhatsAppResult = { ok: boolean; channel: "wati" | "hubtel_sms" | "demo"; message?: string };

export async function sendWhatsAppMessage(phone: string, body: string): Promise<WhatsAppResult> {
  const normalized = normalizeGhPhone(phone);
  if (!normalized) return { ok: false, channel: "demo", message: "Invalid phone" };

  const watiToken = process.env.WATI_API_TOKEN;
  const watiUrl = process.env.WATI_API_URL ?? "https://live-server.wati.io";

  if (watiToken) {
    try {
      const res = await fetch(`${watiUrl}/api/v1/sendSessionMessage/${normalized}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${watiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messageText: body }),
      });
      if (res.ok) return { ok: true, channel: "wati" };
      const err = await res.text();
      console.warn("[WATI] send failed", err);
    } catch (e) {
      console.warn("[WATI] error", e);
    }
  }

  const hubtelId = process.env.HUBTEL_CLIENT_ID;
  const hubtelSecret = process.env.HUBTEL_CLIENT_SECRET;
  if (hubtelId && hubtelSecret) {
    try {
      const qs = new URLSearchParams({
        clientid: hubtelId,
        clientsecret: hubtelSecret,
        from: "AgroLink",
        to: normalized,
        content: body,
      });
      const res = await fetch(`https://smsc.hubtel.com/v1/messages/send?${qs.toString()}`);
      if (res.ok) return { ok: true, channel: "hubtel_sms" };
    } catch (e) {
      console.warn("[Hubtel SMS fallback] error", e);
    }
  }

  if (process.env.VITE_DEMO_MODE === "true" || !watiToken) {
    console.info("[WhatsApp demo]", normalized, body.slice(0, 80));
    return { ok: true, channel: "demo", message: "Logged in demo mode" };
  }

  return { ok: false, channel: "demo", message: "No WhatsApp provider configured" };
}

function normalizeGhPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("233") && digits.length >= 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `233${digits.slice(1)}`;
  if (digits.length === 9) return `233${digits}`;
  return null;
}

export function orderStatusWhatsAppBody(type: string, extras?: Record<string, string>): string {
  const templates: Record<string, string> = {
    order_confirmed: `AgroLink: Payment confirmed for your order. A driver will be assigned shortly. Track: ${extras?.link ?? "agrolink.app/app/buyer/orders"}`,
    delivery_complete: `AgroLink: Your produce has been delivered! Thank you for shopping on AgroLink.`,
    delivery_job: `AgroLink: New delivery job — ${extras?.pickup ?? "pickup"} · GHS ${extras?.fee ?? "—"}. Open AgroLink Drive to accept.`,
    message: `AgroLink: ${extras?.preview ?? "You have a new message"}`,
    dispatched: `AgroLink: Your order is on the way! Driver ${extras?.driver ?? ""} is en route. ETA ~${extras?.eta ?? "soon"}.`,
  };
  return templates[type] ?? `AgroLink: ${extras?.body ?? type}`;
}
