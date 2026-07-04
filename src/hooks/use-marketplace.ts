import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchFeedListings, fetchSellerListings } from "@/lib/api/listings";
import { fetchCartItems, addToCart, updateCartItemQuantity, removeCartItem } from "@/lib/api/cart";
import { fetchBuyerOrders, fetchSellerOrders } from "@/lib/api/orders";
import { fetchNotifications, fetchMessages } from "@/lib/api/notifications";
import { getOrCreateDriverProfile } from "@/lib/api/driver";

export function useFeed(lat?: number, lng?: number) {
  return useQuery({
    queryKey: ["feed", lat, lng],
    queryFn: () => fetchFeedListings({ lat, lng, limit: 30 }),
    staleTime: 30_000,
  });
}

export function useSellerListings(sellerId?: string) {
  return useQuery({
    queryKey: ["seller-listings", sellerId],
    queryFn: () => fetchSellerListings(sellerId!),
    enabled: !!sellerId,
  });
}

export function useCart(userId?: string) {
  return useQuery({
    queryKey: ["cart", userId],
    queryFn: () => fetchCartItems(userId!),
    enabled: !!userId,
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      listingId,
      quantity,
    }: {
      userId: string;
      listingId: string;
      quantity?: number;
    }) => addToCart(userId, listingId, quantity),
    onSuccess: (_, { userId }) => qc.invalidateQueries({ queryKey: ["cart", userId] }),
  });
}

export function useUpdateCartItem(userId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateCartItemQuantity(userId!, itemId, quantity),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart", userId] }),
  });
}

export function useRemoveCartItem(userId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => removeCartItem(userId!, itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart", userId] }),
  });
}

export function useBuyerOrders(buyerId?: string) {
  return useQuery({
    queryKey: ["buyer-orders", buyerId],
    queryFn: () => fetchBuyerOrders(buyerId!),
    enabled: !!buyerId,
    refetchInterval: 15_000,
  });
}

export function useSellerOrders(sellerId?: string) {
  return useQuery({
    queryKey: ["seller-orders", sellerId],
    queryFn: () => fetchSellerOrders(sellerId!),
    enabled: !!sellerId,
    refetchInterval: 15_000,
  });
}

export function useNotifications(userId?: string) {
  return useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => fetchNotifications(userId!),
    enabled: !!userId,
    refetchInterval: 30_000,
  });
}

export function useMessages(userId?: string) {
  return useQuery({
    queryKey: ["messages", userId],
    queryFn: () => fetchMessages(userId!),
    enabled: !!userId,
  });
}

export function useDriverProfile(userId?: string) {
  return useQuery({
    queryKey: ["driver-profile", userId],
    queryFn: () => getOrCreateDriverProfile(userId!),
    enabled: !!userId,
  });
}
