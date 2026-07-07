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
    await supabase
      .rpc("adjust_listing_likes" as never, { listing_id: listingId, delta: 1 } as never)
      .catch(async () => {
        const { data } = await supabase
          .from("listings")
          .select("like_count")
          .eq("id", listingId)
          .single();
        if (data)
          await supabase
            .from("listings")
            .update({ like_count: data.like_count + 1 })
            .eq("id", listingId);
      });
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
    await supabase.from("listing_likes").delete().eq("listing_id", listingId).eq("user_id", userId);
    await supabase
      .rpc("adjust_listing_likes" as never, { listing_id: listingId, delta: -1 } as never)
      .catch(async () => {
        const { data } = await supabase
          .from("listings")
          .select("like_count")
          .eq("id", listingId)
          .single();
        if (data)
          await supabase
            .from("listings")
            .update({ like_count: Math.max(0, data.like_count - 1) })
            .eq("id", listingId);
      });
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
  const { data, error } = await supabase
    .from("listing_comments")
    .select("id, user_id, content, created_at, profile:profiles(display_name)")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id,
    user_id: c.user_id,
    author: (c.profile as { display_name: string | null } | null)?.display_name ?? "User",
    content: c.content,
    created_at: c.created_at,
  }));
}

export async function addComment(
  listingId: string,
  userId: string,
  content: string,
  meta?: { sellerId?: string; listingTitle?: string; actorName?: string },
) {
  const { error } = await supabase
    .from("listing_comments")
    .insert({ listing_id: listingId, user_id: userId, content });
  if (error) throw error;
  const { data } = await supabase
    .from("listings")
    .select("comment_count")
    .eq("id", listingId)
    .single();
  if (data)
    await supabase
      .from("listings")
      .update({ comment_count: data.comment_count + 1 })
      .eq("id", listingId);

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
    const { data } = await supabase
      .from("listings")
      .select("save_count")
      .eq("id", listingId)
      .single();
    if (data)
      await supabase
        .from("listings")
        .update({ save_count: data.save_count + 1 })
        .eq("id", listingId);
  } else {
    await supabase.from("bookmarks").delete().eq("listing_id", listingId).eq("user_id", userId);
    const { data } = await supabase
      .from("listings")
      .select("save_count")
      .eq("id", listingId)
      .single();
    if (data)
      await supabase
        .from("listings")
        .update({ save_count: Math.max(0, data.save_count - 1) })
        .eq("id", listingId);
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

export async function toggleFollow(
  followerId: string,
  farmerSlug: string,
  following: boolean,
  actorName?: string,
) {
  if (following) {
    const { error } = await supabase
      .from("follows")
      .insert({ follower_id: followerId, farmer_slug: farmerSlug });
    if (error && !error.message.includes("duplicate")) throw error;
    await apiFetch("/api/comms/notify", {
      method: "POST",
      body: JSON.stringify({ type: "follow", actorName, farmerSlug }),
    }).catch(() => {});
  } else {
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("farmer_slug", farmerSlug);
  }
}

export async function fetchIsFollowing(followerId: string, farmerSlug: string): Promise<boolean> {
  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("farmer_slug", farmerSlug)
    .maybeSingle();
  return !!data;
}
