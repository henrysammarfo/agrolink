/** Hubtel Identity Verification — Ghana Card / mobile verify */

export type GhanaCardVerifyResult = {
  verified: boolean;
  message: string;
  data?: {
    name?: string;
    dateOfBirth?: string;
    gender?: string;
  };
};

function basicAuth(): string | null {
  const id = process.env.HUBTEL_CLIENT_ID;
  const secret = process.env.HUBTEL_CLIENT_SECRET;
  if (!id || !secret) return null;
  return Buffer.from(`${id}:${secret}`).toString("base64");
}

export async function verifyGhanaCard(params: {
  ghanaCardId: string;
  fullName?: string;
}): Promise<GhanaCardVerifyResult> {
  const auth = basicAuth();
  if (!auth) {
    return {
      verified: false,
      message: "Hubtel keys not configured — manual review required",
    };
  }

  const cardId = params.ghanaCardId.trim().toUpperCase();
  try {
    const res = await fetch(
      `https://api.hubtel.com/v1/identityverify/ghanacard/${encodeURIComponent(cardId)}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        },
      },
    );

    if (res.status === 404) {
      return { verified: false, message: "Ghana Card not found in NIA registry" };
    }

    const json = (await res.json()) as {
      ResponseCode?: string;
      Data?: { FullName?: string; DateOfBirth?: string; Gender?: string };
      Message?: string;
    };

    const ok = json.ResponseCode === "0000" || json.ResponseCode === "0001";
    if (!ok) {
      return { verified: false, message: json.Message ?? "Verification failed" };
    }

    if (params.fullName && json.Data?.FullName) {
      const a = params.fullName.toLowerCase().split(/\s+/);
      const b = json.Data.FullName.toLowerCase();
      const match = a.some((part) => part.length > 2 && b.includes(part));
      if (!match) {
        return { verified: false, message: "Name on card does not match profile" };
      }
    }

    return {
      verified: true,
      message: "Ghana Card verified via Hubtel",
      data: {
        name: json.Data?.FullName,
        dateOfBirth: json.Data?.DateOfBirth,
        gender: json.Data?.Gender,
      },
    };
  } catch (e) {
    return {
      verified: false,
      message: e instanceof Error ? e.message : "Hubtel verification error",
    };
  }
}
