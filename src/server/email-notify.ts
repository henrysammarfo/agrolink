/** Free order/OTP emails via Resend — 3,000/month on free tier (resend.com) */

export type EmailResult = { ok: boolean; channel: "resend" | "demo"; message?: string };

export async function sendOrderEmail(opts: {
  to: string;
  subject: string;
  title: string;
  body: string;
  link?: string;
}): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "AgroLink <onboarding@resend.dev>";

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h1 style="font-size:20px;color:#166534">${opts.title}</h1>
      <p style="color:#374151;line-height:1.5">${opts.body}</p>
      ${opts.link ? `<p><a href="${opts.link}" style="color:#166534">Open in AgroLink →</a></p>` : ""}
      <p style="font-size:12px;color:#9ca3af;margin-top:24px">AgroLink · Ghana produce corridor</p>
    </div>
  `;

  if (!apiKey) {
    if (process.env.VITE_DEMO_MODE === "true") {
      console.info("[Email demo]", opts.to, opts.subject);
      return { ok: true, channel: "demo", message: "Logged in demo mode" };
    }
    return { ok: false, channel: "demo", message: "RESEND_API_KEY not set" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        html,
      }),
    });
    if (res.ok) return { ok: true, channel: "resend" };
    const err = await res.text();
    console.warn("[Resend] send failed", err);
    return { ok: false, channel: "resend", message: err };
  } catch (e) {
    console.warn("[Resend] error", e);
    return { ok: false, channel: "resend", message: e instanceof Error ? e.message : "Send failed" };
  }
}

export async function sendOtpEmail(opts: {
  to: string;
  code: string;
  orderTotalGhs: number;
}): Promise<EmailResult> {
  return sendOrderEmail({
    to: opts.to,
    subject: `AgroLink verification code — GHS ${opts.orderTotalGhs.toFixed(0)} order`,
    title: "Verify your checkout",
    body: `Your verification code is <strong>${opts.code}</strong>. Valid for 10 minutes. Do not share this code.`,
  });
}
