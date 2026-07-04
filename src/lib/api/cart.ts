import { supabase } from "@/integrations/supabase/client";
import type { CartItemRow } from "@/lib/types/marketplace";

export async function getOrCreateCart(userId: string) {
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

export async function fetchCartItems(userId: string): Promise<CartItemRow[]> {
  const cartId = await getOrCreateCart(userId);
  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `
      id, cart_id, listing_id, quantity,
      listing:feed_rank!cart_items_listing_id_fkey(*)
    `,
    )
    .eq("cart_id", cartId);
  if (error) {
    // fallback without join if view join fails
    const { data: items, error: e2 } = await supabase
      .from("cart_items")
      .select("id, cart_id, listing_id, quantity")
      .eq("cart_id", cartId);
    if (e2) throw e2;
    const listings = await Promise.all(
      (items ?? []).map(async (it) => {
        const { data: l } = await supabase
          .from("feed_rank")
          .select("*")
          .eq("id", it.listing_id)
          .maybeSingle();
        return { ...it, listing: l ?? undefined };
      }),
    );
    return listings as CartItemRow[];
  }
  return (data ?? []) as CartItemRow[];
}

export async function addToCart(userId: string, listingId: string, quantity = 1) {
  const cartId = await getOrCreateCart(userId);
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: existing.quantity + quantity })
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

export async function clearCart(userId: string) {
  const cartId = await getOrCreateCart(userId);
  const { error } = await supabase.from("cart_items").delete().eq("cart_id", cartId);
  if (error) throw error;
}
