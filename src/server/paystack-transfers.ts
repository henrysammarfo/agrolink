const PAYSTACK_BASE = "https://api.paystack.co";

export type TransferResult = {
  ok: boolean;
  reference?: string;
  message: string;
};

function authHeader(): Record<string, string> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return {};
  return { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" };
}

export async function createMoMoTransferRecipient(params: {
  name: string;
  phone: string;
  provider: "mtn" | "vod" | "atl";
}): Promise<{ recipientCode: string } | null> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return null;

  const phone = params.phone.replace(/\D/g, "").replace(/^233/, "0");
  const res = await fetch(`${PAYSTACK_BASE}/transferrecipient`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({
      type: "mobile_money",
      name: params.name,
      account_number: phone,
      bank_code: params.provider,
      currency: "GHS",
    }),
  });
  const json = (await res.json()) as { status: boolean; data?: { recipient_code: string }; message?: string };
  if (!json.status || !json.data?.recipient_code) {
    console.warn("[PaystackTransfer] recipient failed:", json.message);
    return null;
  }
  return { recipientCode: json.data.recipient_code };
}

export async function initiateTransfer(params: {
  amountGhs: number;
  recipientCode: string;
  reason: string;
  reference: string;
}): Promise<TransferResult> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return { ok: true, reference: `demo-${params.reference}`, message: "Demo transfer (no Paystack secret)" };
  }

  const res = await fetch(`${PAYSTACK_BASE}/transfer`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({
      source: "balance",
      amount: Math.round(params.amountGhs * 100),
      recipient: params.recipientCode,
      reason: params.reason,
      reference: params.reference,
      currency: "GHS",
    }),
  });
  const json = (await res.json()) as { status: boolean; data?: { reference: string }; message?: string };
  return {
    ok: json.status,
    reference: json.data?.reference ?? params.reference,
    message: json.message ?? (json.status ? "Transfer initiated" : "Transfer failed"),
  };
}
