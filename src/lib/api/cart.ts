import { supabase } from "@/integrations/supabase/client";
import type { CartItemRow } from "@/lib/types/marketplace";
import type { FeedListing } from "@/lib/types/marketplace";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUserId(userId: string): boolean {
  return UUID_RE.test(userId);
}

export async function getOrCreateCart(userId: string) {
  if (!isValidUserId(userId)) {
    throw new Error("Sign in with a real account to use your cart.");
  }
  const { data: existing } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("carts")
    .insert({ user_id: userId })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

function mapListingRow(
  row: Record<string, unknown>,
  profile?: { display_name?: string | null; slug?: string | null; avatar_url?: string | null; verified?: boolean; seller_rating?: number | null } | null,
): FeedListing {
  return {
    ...(row as FeedListing),
    seller_name: (row.seller_name as string | null) ?? profile?.display_name ?? null,
    seller_slug: (row.seller_slug as string | null) ?? profile?.slug ?? null,
    seller_avatar: (row.seller_avatar as string | null) ?? profile?.avatar_url ?? null,
    seller_verified: (row.seller_verified as boolean | undefined) ?? profile?.verified ?? false,
    seller_rating: (row.seller_rating as number | null) ?? profile?.seller_rating ?? null,
    ai_demand_score: (row.ai_demand_score as number | undefined) ?? 0.5,
    feed_score: (row.feed_score as number | undefined) ?? 0.5,
  };
}

export async function fetchCartItems(userId: string): Promise<CartItemRow[]> {
  const cartId = await getOrCreateCart(userId);
  const { data: items, error } = await supabase
    .from("cart_items")
    .select("id, cart_id, listing_id, quantity")
    .eq("cart_id", cartId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!items?.length) return [];

  const listingIds = items.map((it) => it.listing_id);
  const [{ data: ranked }, { data: rawListings }] = await Promise.all([
    supabase.from("feed_rank").select("*").in("id", listingIds),
    supabase.from("listings").select("*").in("id", listingIds),
  ]);

  const rankedMap = new Map((ranked ?? []).map((l) => [l.id, l as FeedListing]));
  const rawMap = new Map((rawListings ?? []).map((l) => [l.id, l]));

  const sellerIds = [...new Set((rawListings ?? []).map((l) => l.seller_id))];
  const { data: profiles } = sellerIds.length
    ? await supabase.from("profiles").select("id, display_name, slug, avatar_url, verified, seller_rating").in("id", sellerIds)
    : { data: [] as { id: string; display_name: string | null; slug: string | null; avatar_url: string | null; verified: boolean; seller_rating: number | null }[] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return items.map((it) => {
    const rankedListing = rankedMap.get(it.listing_id);
    const raw = rawMap.get(it.listing_id);
    const listing =
      rankedListing ??
      (raw
        ? mapListingRow(raw as Record<string, unknown>, profileMap.get(raw.seller_id))
        : undefined);
    return { ...it, listing };
  });
}

async function assertListingStock(listingId: string, requestedQty: number) {
  const { data: listing, error } = await supabase
    .from("listings")
    .select("quantity, status, title, unit")
    .eq("id", listingId)
    .maybeSingle();
  if (error) throw error;
  if (!listing || listing.status !== "active") {
    throw new Error("This listing is no longer available.");
  }
  if (Number(listing.quantity) < requestedQty) {
    const left = Number(listing.quantity);
    throw new Error(
      left <= 0
        ? `${listing.title ?? "This item"} is sold out.`
        : `Only ${left} ${listing.unit} left for ${listing.title ?? "this item"}.`,
    );
  }
  return listing;
}

export async function addToCart(userId: string, listingId: string, quantity = 1) {
  if (!isValidUserId(userId)) {
    throw new Error("Sign in with a real account to add items to your cart.");
  }
  const cartId = await getOrCreateCart(userId);
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("listing_id", listingId)
    .maybeSingle();

  const nextQty = (existing?.quantity ?? 0) + quantity;
  await assertListingStock(listingId, nextQty);

  if (existing) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: nextQty })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("cart_items")
      .insert({ cart_id: cartId, listing_id: listingId, quantity });
    if (error) throw error;
  }
}

export async function updateCartItemQuantity(userId: string, itemId: string, quantity: number) {
  const cartId = await getOrCreateCart(userId);
  if (quantity <= 0) {
    await supabase.from("cart_items").delete().eq("id", itemId).eq("cart_id", cartId);
    return;
  }
  const { data: item } = await supabase
    .from("cart_items")
    .select("listing_id")
    .eq("id", itemId)
    .eq("cart_id", cartId)
    .maybeSingle();
  if (!item?.listing_id) throw new Error("Cart item not found");
  await assertListingStock(item.listing_id, quantity);

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", itemId)
    .eq("cart_id", cartId);
  if (error) throw error;
}

export async function removeCartItem(userId: string, itemId: string) {
  const cartId = await getOrCreateCart(userId);
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", itemId)
    .eq("cart_id", cartId);
  if (error) throw error;
}

export async function reorderFromOrder(userId: string, order: { items?: { listing_id: string; quantity: number }[] }) {
  if (!order.items?.length) return 0;
  let added = 0;
  for (const item of order.items) {
    if (!item.listing_id) continue;
    await addToCart(userId, item.listing_id, item.quantity);
    added++;
  }
  return added;
}

export async function clearCart(userId: string) {
  const cartId = await getOrCreateCart(userId);
  const { error } = await supabase.from("cart_items").delete().eq("cart_id", cartId);
  if (error) throw error;
}
