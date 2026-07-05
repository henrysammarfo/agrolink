/** Ghana Card verification — admin manual review (no paid Hubtel required) */

export type GhanaCardVerifyResult = {
  verified: boolean;
  message: string;
  data?: {
    name?: string;
    dateOfBirth?: string;
    gender?: string;
  };
};

/** Ghana Card format: GHA-XXXXXXXXX-X */
function isValidGhanaCardFormat(id: string): boolean {
  return /^GHA-\d{9}-\d$/i.test(id.trim());
}

export async function verifyGhanaCard(params: {
  ghanaCardId: string;
  fullName?: string;
}): Promise<GhanaCardVerifyResult> {
  const cardId = params.ghanaCardId.trim().toUpperCase();

  if (!isValidGhanaCardFormat(cardId)) {
    return {
      verified: false,
      message: "Invalid Ghana Card format — use GHA-XXXXXXXXX-X",
    };
  }

  return {
    verified: true,
    message: "Format valid — admin will verify against uploaded document (free, no API key)",
    data: { name: params.fullName },
  };
}
