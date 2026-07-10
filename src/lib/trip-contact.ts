import { toast } from "sonner";

/** Normalize Ghana phone numbers for tel: links. */
export function normalizeGhPhone(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("233") && digits.length >= 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length >= 10) return `+233${digits.slice(1)}`;
  if (digits.length === 9) return `+233${digits}`;
  return raw.startsWith("+") ? raw : `+${digits}`;
}

export function pickDriverPhone(driver: {
  profile?: { phone?: string | null } | null;
  momo_number?: string | null;
} | null | undefined): string | null {
  return normalizeGhPhone(driver?.profile?.phone ?? driver?.momo_number ?? null);
}

export function pickBuyerPhone(buyer: { phone?: string | null } | null | undefined): string | null {
  return normalizeGhPhone(buyer?.phone ?? null);
}

/** Open device dialer; on desktop copy number to clipboard. */
export function dialPhone(raw: string | null | undefined, label = "Contact"): boolean {
  const phone = normalizeGhPhone(raw);
  if (!phone) return false;

  const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    window.location.href = `tel:${phone}`;
    return true;
  }

  void navigator.clipboard?.writeText(phone).then(
    () => toast.success(`${label} number copied`, { description: `${phone} — paste into your phone app` }),
    () => toast.info(`Call ${label}`, { description: phone }),
  );
  return true;
}
