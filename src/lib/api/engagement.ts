import { supabase } from "@/integrations/supabase/client";
import { apiFetch } from "@/lib/api/fetch-auth";
import type { FeedComment } from "@/lib/types/marketplace";

export async function toggleLike(
  listingId: string,
  userId: string,
  liked: boolean,
  meta?: { sellerId?: string; listingTitle?: string; actorName?: string },
) {
  if (liked) {
    const { error } = await supabase
      .from("listing_likes")
      .insert({ listing_id: listingId, user_id: userId });
    if (error && !error.message.includes("duplicate")) throw error;
    if (meta?.sellerId) {
      await apiFetch("/api/comms/notify", {
        method: "POST",
        body: JSON.stringify({
          type: "like",
          actorName: meta.actorName,
          listingId,
          listingTitle: meta.listingTitle,
          sellerId: meta.sellerId,
        }),
      }).catch(() => {});
    }
  } else {
    const { error } = await supabase
      .from("listing_likes")
      .delete()
      .eq("listing_id", listingId)
      .eq("user_id", userId);
    if (error) throw error;
  }
}

export async function fetchUserLiked(listingId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("listing_likes")
    .select("id")
    .eq("listing_id", listingId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

export async function fetchComments(listingId: string): Promise<FeedComment[]> {
  const res = await fetch(`/api/listings/comments?listingId=${encodeURIComponent(listingId)}`);
  const json = (await res.json()) as { comments?: FeedComment[]; error?: string };
  if (!res.ok) throw new Error(json.error ?? "Could not load comments");
  return json.comments ?? [];
}

export async function addComment(
  listingId: string,
  _userId: string,
  content: string,
  meta?: { sellerId?: string; listingTitle?: string; actorName?: string },
) {
  const res = await apiFetch("/api/listings/comments", {
    method: "POST",
    body: JSON.stringify({ listingId, content }),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string; moderated?: boolean };
  if (!res.ok) {
    throw new Error(json.error ?? "Could not post comment");
  }

  if (meta?.sellerId) {
    await apiFetch("/api/comms/notify", {
      method: "POST",
      body: JSON.stringify({
        type: "comment",
        actorName: meta.actorName,
        listingId,
        listingTitle: meta.listingTitle,
        sellerId: meta.sellerId,
      }),
    }).catch(() => {});
  }
}

export async function toggleBookmark(listingId: string, userId: string, saved: boolean) {
  if (saved) {
    const { error } = await supabase
      .from("bookmarks")
      .insert({ listing_id: listingId, user_id: userId });
    if (error && !error.message.includes("duplicate")) throw error;
  } else {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("listing_id", listingId)
      .eq("user_id", userId);
    if (error) throw error;
  }
}

export async function fetchUserBookmarked(listingId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("listing_id", listingId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

export async function fetchFollowersList(slug: string) {
  const res = await apiFetch(`/api/social/followers?slug=${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error("Could not load followers");
  const json = (await res.json()) as { users: FollowUser[] };
  return json.users ?? [];
}

export async function fetchFollowingList() {
  const res = await apiFetch("/api/social/following");
  if (!res.ok) throw new Error("Could not load following");
  const json = (await res.json()) as { users: FollowUser[] };
  return json.users ?? [];
}

export type FollowUser = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  slug: string | null;
  username: string | null;
  region: string | null;
  followed_at?: string;
  follows_you?: boolean;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Resolve URL handle (slug, @username, or UUID) to canonical profile slug for follows. */
async function resolveFarmerSlug(key: string): Promise<string> {
  const normalized = key.trim().toLowerCase();
  if (!normalized) throw new Error("Invalid farmer profile");

  if (UUID_RE.test(key.trim())) {
    const { data } = await supabase.from("profiles").select("slug").eq("id", key.trim()).maybeSingle();
    if (data?.slug) return data.slug.toLowerCase();
    throw new Error("Seller profile is not set up yet");
  }

  const { data: bySlug } = await supabase.from("profiles").select("slug").eq("slug", normalized).maybeSingle();
  if (bySlug?.slug) return bySlug.slug.toLowerCase();

  const { data: byUsername } = await supabase
    .from("profiles")
    .select("slug")
    .ilike("username", normalized)
    .maybeSingle();
  if (byUsername?.slug) return byUsername.slug.toLowerCase();

  return normalized;
}

export async function toggleFollow(
  followerId: string,
  farmerSlug: string,
  following: boolean,
  actorName?: string,
) {
  const slug = await resolveFarmerSlug(farmerSlug);

  if (following) {
    const { error } = await supabase
      .from("follows")
      .insert({ follower_id: followerId, farmer_slug: slug });
    if (error && !error.message.includes("duplicate")) throw error;
    await apiFetch("/api/comms/notify", {
      method: "POST",
      body: JSON.stringify({ type: "follow", actorName, farmerSlug: slug }),
    }).catch(() => {});
  } else {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("farmer_slug", slug);
    if (error) throw error;
  }
}

export async function fetchIsFollowing(followerId: string, farmerSlug: string): Promise<boolean> {
  const slug = await resolveFarmerSlug(farmerSlug);
  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("farmer_slug", slug)
    .maybeSingle();
  return !!data;
}

export async function reportListing(listingId: string, reason = "user_flag") {
  const res = await apiFetch("/api/listings/report", {
    method: "POST",
    body: JSON.stringify({ listingId, reason }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Could not report listing");
  }
  return (await res.json()) as { ok: boolean; alreadyReported?: boolean };
}
