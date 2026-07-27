/** Resolve in-app profile URL for a user handle. */
export function userProfileLink(handle: string | null | undefined): string | null {
  const h = handle?.trim();
  if (!h) return null;
  return `/app/users/${encodeURIComponent(h)}`;
}

/** Parse notification / legacy links into typed in-app routes. */
export function parseNotificationTarget(link: string | null | undefined):
  | { to: "/app/users/$slug"; params: { slug: string } }
  | { to: string; params?: undefined } {
  if (!link) return { to: "/app/inbox" };

  const inAppUser = link.match(/^\/app\/users\/([^/?#]+)/);
  if (inAppUser) {
    return { to: "/app/users/$slug", params: { slug: decodeURIComponent(inAppUser[1]) } };
  }

  const publicFarmer = link.match(/^\/farmers\/([^/?#]+)/);
  if (publicFarmer && publicFarmer[1] !== "") {
    return { to: "/app/users/$slug", params: { slug: decodeURIComponent(publicFarmer[1]) } };
  }

  return { to: link };
}

export function profileHandle(profile: {
  username?: string | null;
  slug?: string | null;
  id?: string;
} | null | undefined): string | null {
  if (!profile) return null;
  return profile.username ?? profile.slug ?? profile.id ?? null;
}

/** True when a public `/app/users/$slug` handle is the signed-in user (edit home = `/app/profile`). */
export function isOwnProfileHandle(
  handle: string | null | undefined,
  profile: { username?: string | null; slug?: string | null; id?: string } | null | undefined,
  userId?: string | null,
): boolean {
  const h = handle?.trim().toLowerCase();
  if (!h || !profile) return false;
  const candidates = [profile.username, profile.slug, profile.id, userId]
    .filter(Boolean)
    .map((v) => String(v).trim().toLowerCase());
  return candidates.includes(h);
}
