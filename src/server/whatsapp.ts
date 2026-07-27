/** WhatsApp order updates — Meta Cloud API direct (free tier, no WATI/Hubtel) */

export type WhatsAppResult = {
  ok: boolean;
  channel: "meta_whatsapp" | "demo";
  message?: string;
};

export async function sendWhatsAppMessage(phone: string, body: string): Promise<WhatsAppResult> {
  const normalized = normalizeGhPhone(phone);
  if (!normalized) return { ok: false, channel: "demo", message: "Invalid phone" };

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION ?? "v21.0";

  if (token && phoneNumberId) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: normalized,
            type: "text",
            text: { body: body.slice(0, 4096) },
          }),
        },
      );
      if (res.ok) return { ok: true, channel: "meta_whatsapp" };
      const err = await res.text();
      console.warn("[Meta WhatsApp] send failed", err);
    } catch (e) {
      console.warn("[Meta WhatsApp] error", e);
    }
  }

  if (process.env.VITE_DEMO_MODE === "true" || !token) {
    console.info("[WhatsApp demo]", normalized, body.slice(0, 80));
    return { ok: true, channel: "demo", message: "Logged in demo mode" };
  }

  return { ok: false, channel: "demo", message: "Meta WhatsApp not configured" };
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
    farmer_sale: `AgroLink: A buyer ordered your ${extras?.crop ?? "produce"}. Prepare for pickup. MoMo after delivery. Open AgroLink Farmer.`,
  };
  return templates[type] ?? `AgroLink: ${extras?.body ?? type}`;
}
