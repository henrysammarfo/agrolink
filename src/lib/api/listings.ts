import { supabase } from "@/integrations/supabase/client";
import type { FeedListing, ListingStatus, CropType } from "@/lib/types/marketplace";
import { rankListings } from "@/lib/feed-algorithm";

export async function fetchFeedListings(opts?: {
  lat?: number;
  lng?: number;
  limit?: number;
  cursor?: string;
}): Promise<{ listings: FeedListing[]; nextCursor: string | null }> {
  const limit = opts?.limit ?? 20;
  let query = supabase
    .from("feed_rank")
    .select("*")
    .order("feed_score", { ascending: false })
    .order("id", { ascending: true })
    .limit(limit);

  if (opts?.cursor) {
    query = query.gt("id", opts.cursor);
  }

  const { data, error } = await query;
  if (error) throw error;

  const ranked = rankListings((data ?? []) as FeedListing[], opts?.lat, opts?.lng);
  const nextCursor = ranked.length === limit ? (ranked[ranked.length - 1]?.id ?? null) : null;
  return { listings: ranked, nextCursor };
}

export async function fetchListingById(id: string): Promise<FeedListing | null> {
  const { data, error } = await supabase.from("feed_rank").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as FeedListing | null;
}

export async function fetchSellerListings(sellerId: string): Promise<FeedListing[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FeedListing[];
}

export async function fetchListingsBySlug(
  slug: string,
): Promise<{ profile: Record<string, unknown>; listings: FeedListing[] }> {
  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (pErr) throw pErr;
  if (!profile) return { profile: {}, listings: [] };

  const { data: listings, error: lErr } = await supabase
    .from("feed_rank")
    .select("*")
    .eq("seller_id", profile.id)
    .order("created_at", { ascending: false });
  if (lErr) throw lErr;
  return { profile, listings: (listings ?? []) as FeedListing[] };
}

export type CreateListingInput = {
  title: string;
  crop_type: CropType;
  description?: string;
  price_per_unit: number;
  unit: string;
  quantity: number;
  hashtags: string[];
  location_name: string;
  lat: number;
  lng: number;
  image_url?: string;
  video_url?: string;
  organic?: boolean;
};

export async function createListing(input: CreateListingInput, sellerId: string) {
  const { data, error } = await supabase
    .from("listings")
    .insert({
      seller_id: sellerId,
      title: input.title,
      crop_type: input.crop_type,
      description: input.description ?? null,
      price_per_unit: input.price_per_unit,
      unit: input.unit,
      quantity: input.quantity,
      hashtags: input.hashtags,
      location_name: input.location_name,
      lat: input.lat,
      lng: input.lng,
      image_url: input.image_url ?? null,
      video_url: input.video_url ?? null,
      organic: input.organic ?? false,
      status: "pending_review" as ListingStatus,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function activateListing(listingId: string) {
  const { error } = await supabase
    .from("listings")
    .update({ status: "active" })
    .eq("id", listingId);
  if (error) throw error;
}

export async function rejectListing(listingId: string) {
  const { error } = await supabase
    .from("listings")
    .update({ status: "rejected" })
    .eq("id", listingId);
  if (error) throw error;
}

export async function uploadListingMedia(
  file: File,
  userId: string,
  type: "image" | "video",
): Promise<string> {
  const bucket = type === "video" ? "listing-videos" : "listing-images";
  const ext = file.name.split(".").pop() ?? (type === "video" ? "mp4" : "jpg");
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function incrementViewCount(listingId: string) {
  await supabase
    .rpc("increment_listing_views" as never, { listing_id: listingId } as never)
    .catch(() => {
      // fallback if RPC not deployed
      supabase.from("listings").update({ view_count: 1 }).eq("id", listingId);
    });
}
