import { supabase } from "@/integrations/supabase/client";
import type { FeedListing } from "@/lib/types/marketplace";

export type PublicProfile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  region: string | null;
  slug: string | null;
  username: string | null;
  verified: boolean;
  seller_rating: number | null;
  seller_rating_count: number | null;
  listing_count: number | null;
  follower_count?: number | null;
};

export async function fetchPublicSellers(limit = 12): Promise<PublicProfile[]> {
  const res = await fetch(`/api/stats/public-sellers?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to load sellers");
  const json = (await res.json()) as { sellers?: PublicProfile[] };
  return json.sellers ?? [];
}

export async function fetchPublicDriverInfo(userId: string) {
  const { data, error } = await supabase
    .from("driver_profiles")
    .select("vehicle_type, verification_status, plate_number, available")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as {
    vehicle_type: string | null;
    verification_status: string | null;
    plate_number: string | null;
    available: boolean | null;
  } | null;
}

export async function fetchDriverDeliveryCount(userId: string) {
  const { data: dp } = await supabase.from("driver_profiles").select("id").eq("user_id", userId).maybeSingle();
  if (!dp?.id) return 0;
  const { count } = await supabase
    .from("deliveries")
    .select("id", { count: "exact", head: true })
    .eq("driver_id", dp.id)
    .eq("status", "delivered");
  return count ?? 0;
}

export async function fetchProfileBySlug(slug: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data as PublicProfile | null;
}

export async function fetchProfileStats(userId: string, slug?: string) {
  const farmerKey = (slug ?? userId).trim().toLowerCase();
  const [listings, profileRow, following, completedOrders] = await Promise.all([
    supabase.from("listings").select("id, like_count, view_count").eq("seller_id", userId).eq("status", "active"),
    supabase.from("profiles").select("follower_count").eq("id", userId).maybeSingle(),
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", userId),
    supabase
      .from("order_items")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", userId),
  ]);

  const items = listings.data ?? [];
  return {
    listingCount: items.length,
    totalLikes: items.reduce((s, l) => s + (l.like_count ?? 0), 0),
    totalViews: items.reduce((s, l) => s + (l.view_count ?? 0), 0),
    followers: profileRow.data?.follower_count ?? 0,
    following: following.count ?? 0,
    completedTrades: completedOrders.count ?? 0,
  };
}

export async function fetchUserListings(userId: string): Promise<FeedListing[]> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, slug, avatar_url, verified, seller_rating")
    .eq("id", userId)
    .maybeSingle();

  const { data: listings, error } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", userId)
    .in("status", ["active", "pending_review", "sold_out"])
    .order("created_at", { ascending: false });
  if (error) throw error;

  const ids = (listings ?? []).map((l) => l.id);
  const { data: ranked } = ids.length
    ? await supabase.from("feed_rank").select("*").in("id", ids)
    : { data: [] as FeedListing[] };
  const rankedMap = new Map((ranked ?? []).map((l) => [l.id, l as FeedListing]));

  return (listings ?? []).map((row) => {
    const hit = rankedMap.get(row.id);
    if (hit) return hit;
    return {
      ...(row as FeedListing),
      seller_name: profile?.display_name ?? null,
      seller_slug: profile?.slug ?? null,
      seller_avatar: profile?.avatar_url ?? null,
      seller_verified: profile?.verified ?? false,
      seller_rating: profile?.seller_rating ?? null,
      ai_demand_score: 0.5,
      feed_score: 0.5,
    };
  });
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

export async function fetchPublicBookmarks(userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("public_bookmarks")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.public_bookmarks) return [];

  const { data: marks } = await supabase.from("bookmarks").select("listing_id").eq("user_id", userId);
  const ids = (marks ?? []).map((m) => m.listing_id);
  if (!ids.length) return [];
  const { data } = await supabase.from("feed_rank").select("*").in("id", ids);
  return (data ?? []) as FeedListing[];
}

export async function fetchMarketingStats() {
  const res = await fetch("/api/stats/marketing");
  if (!res.ok) throw new Error("Failed to load marketing stats");
  return res.json() as Promise<{
    activeListings: number;
    completedOrders: number;
    gmv: number;
    sellers: number;
  }>;
}
