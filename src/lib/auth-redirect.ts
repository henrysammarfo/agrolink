/** Canonical site origin for Supabase auth redirects (must match dashboard allowlist). */
export function getSiteOrigin(): string {
  if (typeof window !== "undefined") {
    const fromEnv = import.meta.env.VITE_SITE_URL?.trim();
    if (fromEnv) return fromEnv.replace(/\/$/, "");
    return window.location.origin;
  }
  const fromEnv = process.env.VITE_SITE_URL ?? process.env.SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return "";
}

export function authRedirectUrl(path = "/auth"): string {
  const origin = getSiteOrigin();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return origin ? `${origin}${normalized}` : normalized;
}

export function postAuthRedirectUrl(): string {
  return authRedirectUrl("/app");
}
