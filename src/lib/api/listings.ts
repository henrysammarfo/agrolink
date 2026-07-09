import { supabase } from "@/integrations/supabase/client";
import type { FeedListing, ListingStatus, CropType } from "@/lib/types/marketplace";
import { rankListings } from "@/lib/feed-algorithm";
import { mergeDemoFeedIfEmpty, isSeedFeedEnabled, SEED_FEED_LISTINGS, getDemoFarmerProfileBySlug, getDemoListingsBySellerSlug } from "@/lib/demo-listings";

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

  try {
    const { data, error } = await query;
    if (error) throw error;

    const ranked = rankListings((data ?? []) as FeedListing[], opts?.lat, opts?.lng);
    const withDemo = mergeDemoFeedIfEmpty(ranked);
    const nextCursor =
      withDemo.length === limit ? (withDemo[withDemo.length - 1]?.id ?? null) : null;
    return { listings: withDemo, nextCursor };
  } catch (err) {
    if (isSeedFeedEnabled()) {
      const ranked = rankListings(SEED_FEED_LISTINGS, opts?.lat, opts?.lng);
      return { listings: ranked, nextCursor: null };
    }
    throw err;
  }
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
  const normalized = slug.trim().toLowerCase();
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  let profile: Record<string, unknown> | null = null;
  const { data: byUsername, error: uErr } = await supabase
    .from("profiles")
    .select("*")
    .ilike("username", normalized)
    .maybeSingle();
  if (uErr) throw uErr;
  profile = byUsername;

  if (!profile) {
    const { data: bySlug, error: pErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("slug", normalized)
      .maybeSingle();
    if (pErr) throw pErr;
    profile = bySlug;
  }

  if (!profile && uuidRe.test(slug.trim())) {
    const { data: byId, error: idErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", slug.trim())
      .maybeSingle();
    if (idErr) throw idErr;
    profile = byId;
  }

  if (profile) {
    const { data: listings, error: lErr } = await supabase
      .from("feed_rank")
      .select("*")
      .eq("seller_id", profile.id)
      .order("created_at", { ascending: false });
    if (lErr) throw lErr;
    if ((listings ?? []).length > 0) {
      return { profile, listings: (listings ?? []) as FeedListing[] };
    }
    const { data: allListings, error: allErr } = await supabase
      .from("listings")
      .select("*")
      .eq("seller_id", profile.id)
      .in("status", ["active", "pending_review"])
      .order("created_at", { ascending: false });
    if (allErr) throw allErr;
    return {
      profile,
      listings: (allListings ?? []).map((row) => ({
        ...(row as FeedListing),
        seller_name: profile.display_name,
        seller_slug: profile.slug,
        seller_avatar: profile.avatar_url,
        seller_verified: profile.verified ?? false,
        seller_rating: profile.seller_rating,
        ai_demand_score: 0.5,
        feed_score: 0.5,
      })),
    };
  }

  const demoProfile = getDemoFarmerProfileBySlug(normalized);
  const demoListings = getDemoListingsBySellerSlug(normalized);
  if (demoProfile && demoListings.length) {
    return { profile: demoProfile, listings: demoListings };
  }

  return { profile: {}, listings: [] };
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
  const rawExt = file.name.split(".").pop()?.toLowerCase() ?? "";
  const ext =
    type === "video"
      ? rawExt || "mp4"
      : ["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(rawExt)
        ? rawExt === "jpeg"
          ? "jpg"
          : rawExt
        : "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;
  const contentType =
    type === "video"
      ? file.type || "video/mp4"
      : file.type && file.type !== "application/octet-stream"
        ? file.type
        : ext === "png"
          ? "image/png"
          : ext === "webp"
            ? "image/webp"
            : ext === "heic"
              ? "image/heic"
              : ext === "heif"
                ? "image/heif"
                : "image/jpeg";
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: false,
    contentType,
  });
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
