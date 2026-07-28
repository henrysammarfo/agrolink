/**
 * Public role labels — prefer Seller over Driver for dual-role users.
 * Driver badge only when KYC-approved AND online (or Drive context).
 */

export type DriverBadgeInput = {
  verificationStatus?: string | null;
  available?: boolean | null;
  hasListings?: boolean;
  /** When browsing Drive chrome, surface Driver even if offline. */
  context?: "profile" | "search" | "drive";
};

export type PublicRoleLabel = "Driver" | "Seller" | "User";

export function resolvePublicRoleLabel(i: DriverBadgeInput): PublicRoleLabel {
  const approved = i.verificationStatus === "approved";
  if (i.context === "search") {
    if (i.hasListings) return "Seller";
    if (approved) return "Driver";
    return "User";
  }
  if (i.hasListings && i.context !== "drive") return "Seller";
  if (shouldShowDriverBadge(i)) return "Driver";
  if (i.hasListings) return "Seller";
  return "User";
}

/** Show Driver chip only for transport-first profiles that are live (or Drive context). */
export function shouldShowDriverBadge(i: DriverBadgeInput): boolean {
  if (i.verificationStatus !== "approved") return false;
  if (i.context === "drive") return true;
  if (i.hasListings) return false;
  return !!i.available;
}

export function shouldShowOnlineBadge(i: DriverBadgeInput): boolean {
  return shouldShowDriverBadge(i) && !!i.available;
}
