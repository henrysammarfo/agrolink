const PAYSTACK_BASE = "https://api.paystack.co";

export type EscrowSplit = {
  subaccountCode: string;
  farmerShareGhs: number;
  platformShareGhs: number;
};

/** Ensure farmer has Paystack subaccount for escrow split (DoorDash-style) */
export async function ensureFarmerSubaccount(userId: string): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("paystack_subaccount_code, display_name, phone, bank_code, bank_account_number")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.paystack_subaccount_code) return profile.paystack_subaccount_code;

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    const demoCode = `ACCT_demo_${userId.slice(0, 8)}`;
    await supabaseAdmin
      .from("profiles")
      .update({ paystack_subaccount_code: demoCode })
      .eq("id", userId);
    return demoCode;
  }

  const bankCode = profile?.bank_code ?? "058";
  const accountNumber = profile?.bank_account_number ?? "0000000000";
  const businessName = profile?.display_name ?? `AgroLink Farmer ${userId.slice(0, 6)}`;

  const res = await fetch(`${PAYSTACK_BASE}/subaccount`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      business_name: businessName.slice(0, 80),
      settlement_bank: bankCode,
      account_number: accountNumber,
      percentage_charge: 94,
      description: `AgroLink farmer escrow ${userId.slice(0, 8)}`,
      primary_contact_email: `farmer+${userId.slice(0, 8)}@agrolink.local`,
    }),
  });

  const json = (await res.json()) as {
    status: boolean;
    data?: { subaccount_code: string };
    message?: string;
  };

  if (!json.status || !json.data?.subaccount_code) {
    console.warn("[PaystackSubaccount]", json.message);
    return null;
  }

  await supabaseAdmin
    .from("profiles")
    .update({ paystack_subaccount_code: json.data.subaccount_code })
    .eq("id", userId);

  return json.data.subaccount_code;
}

/** Build split params for MoMo charge — farmer share held in subaccount until delivery */
export async function buildEscrowSplit(params: {
  sellerId: string;
  subtotalGhs: number;
  platformFeePct: number;
}): Promise<EscrowSplit | null> {
  const subaccountCode = await ensureFarmerSubaccount(params.sellerId);
  if (!subaccountCode) return null;

  const farmerShareGhs =
    Math.round(params.subtotalGhs * (1 - params.platformFeePct) * 100) / 100;
  const platformShareGhs =
    Math.round((params.subtotalGhs - farmerShareGhs) * 100) / 100;

  return { subaccountCode, farmerShareGhs, platformShareGhs };
}

export async function releaseEscrow(orderId: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  await supabaseAdmin
    .from("orders")
    .update({
      escrow_status: "released",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  await supabaseAdmin
    .from("payments")
    .update({
      escrow_status: "released",
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", orderId);
}
