import { supabase } from "@/integrations/supabase/client";
import type { FeedListing } from "@/lib/types/marketplace";

export type PublicProfile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  region: string | null;
  slug: string | null;
  verified: boolean;
  seller_rating: number | null;
  seller_rating_count: number | null;
  listing_count: number | null;
};

export async function fetchPublicSellers(limit = 12): Promise<PublicProfile[]> {
  const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "farmer");
  const ids = (roles ?? []).map((r) => r.user_id);
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("id", ids)
    .order("seller_rating", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as PublicProfile[];
}

export async function fetchProfileBySlug(slug: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data as PublicProfile | null;
}

export async function fetchProfileStats(userId: string) {
  const [listings, followers, following] = await Promise.all([
    supabase.from("listings").select("id, like_count, view_count").eq("seller_id", userId).eq("status", "active"),
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("farmer_slug", userId),
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", userId),
  ]);

  const items = listings.data ?? [];
  return {
    listingCount: items.length,
    totalLikes: items.reduce((s, l) => s + (l.like_count ?? 0), 0),
    totalViews: items.reduce((s, l) => s + (l.view_count ?? 0), 0),
    followers: followers.count ?? 0,
    following: following.count ?? 0,
  };
}

export async function fetchUserListings(userId: string): Promise<FeedListing[]> {
  const { data, error } = await supabase
    .from("feed_rank")
    .select("*")
    .eq("seller_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FeedListing[];
}

export async function fetchUserBookmarks(userId: string): Promise<FeedListing[]> {
  const { data: marks } = await supabase.from("bookmarks").select("listing_id").eq("user_id", userId);
  const ids = (marks ?? []).map((m) => m.listing_id);
  if (!ids.length) return [];
  const { data } = await supabase.from("feed_rank").select("*").in("id", ids);
  return (data ?? []) as FeedListing[];
}

export async function fetchUserLikedListings(userId: string): Promise<FeedListing[]> {
  const { data: likes } = await supabase.from("listing_likes").select("listing_id").eq("user_id", userId);
  const ids = (likes ?? []).map((l) => l.listing_id);
  if (!ids.length) return [];
  const { data } = await supabase.from("feed_rank").select("*").in("id", ids);
  return (data ?? []) as FeedListing[];
}

export async function fetchMarketingStats() {
  const [listings, orders, profiles] = await Promise.all([
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("orders").select("total_amount").eq("payment_status", "paid"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);
  const gmv = (orders.data ?? []).reduce((s, o) => s + Number(o.total_amount), 0);
  return {
    activeListings: listings.count ?? 0,
    completedOrders: orders.data?.length ?? 0,
    gmv,
    sellers: profiles.count ?? 0,
  };
}
