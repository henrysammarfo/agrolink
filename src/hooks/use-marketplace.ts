import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchFeedListings, fetchSellerListings } from "@/lib/api/listings";
import { fetchCartItems, addToCart, updateCartItemQuantity, removeCartItem, reorderFromOrder } from "@/lib/api/cart";
import { fetchBuyerOrders, fetchSellerOrders, fetchAvailableDeliveries, fetchDriverDeliveries, loadTransportJobs } from "@/lib/api/orders";
import { fetchNotifications, fetchMessages, fetchUnreadNotificationCount } from "@/lib/api/notifications";
import { fetchConversations, fetchUnreadMessageCount } from "@/lib/api/chat";
import { fetchDriverProfile } from "@/lib/api/driver-onboarding";
import { fetchPublicSellers, fetchProfileStats, fetchUserListings, fetchUserBookmarks, fetchUserLikedListings, fetchMarketingStats } from "@/lib/api/profiles";
import { fetchUserPayouts, fetchFarmerRevenue, fetchAdminPayments, fetchDriverEarnings } from "@/lib/api/payouts";
import { fetchDisputes } from "@/lib/api/disputes";

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

export function useConversations(userId?: string) {
  return useQuery({
    queryKey: ["conversations", userId],
    queryFn: () => fetchConversations(userId!),
    enabled: !!userId,
    refetchInterval: 15_000,
  });
}

export function useUnreadCounts(userId?: string) {
  return useQuery({
    queryKey: ["unread-counts", userId],
    queryFn: async () => ({
      notifications: await fetchUnreadNotificationCount(userId!),
      messages: await fetchUnreadMessageCount(userId!),
    }),
    enabled: !!userId,
    refetchInterval: 15_000,
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
    queryFn: () => fetchDriverProfile(userId!),
    enabled: !!userId,
  });
}

export function usePublicSellers(limit = 12) {
  return useQuery({
    queryKey: ["public-sellers", limit],
    queryFn: () => fetchPublicSellers(limit),
    staleTime: 60_000,
  });
}

export function useMarketingStats() {
  return useQuery({
    queryKey: ["marketing-stats"],
    queryFn: fetchMarketingStats,
    staleTime: 120_000,
  });
}

export function useFeedTeaser(limit = 6) {
  return useQuery({
    queryKey: ["feed-teaser", limit],
    queryFn: async () => (await fetchFeedListings({ limit })).listings,
    staleTime: 30_000,
  });
}

export function useProfileStats(userId?: string, slug?: string) {
  return useQuery({
    queryKey: ["profile-stats", userId, slug],
    queryFn: () => fetchProfileStats(userId!, slug),
    enabled: !!userId,
  });
}

export function useUserListings(userId?: string) {
  return useQuery({
    queryKey: ["user-listings", userId],
    queryFn: () => fetchUserListings(userId!),
    enabled: !!userId,
  });
}

export function useUserBookmarks(userId?: string) {
  return useQuery({
    queryKey: ["user-bookmarks", userId],
    queryFn: () => fetchUserBookmarks(userId!),
    enabled: !!userId,
  });
}

export function useUserLikedListings(userId?: string) {
  return useQuery({
    queryKey: ["user-liked", userId],
    queryFn: () => fetchUserLikedListings(userId!),
    enabled: !!userId,
  });
}

export function useFarmerRevenue(userId?: string) {
  return useQuery({
    queryKey: ["farmer-revenue", userId],
    queryFn: () => fetchFarmerRevenue(userId!),
    enabled: !!userId,
    refetchInterval: 60_000,
  });
}

export function usePayouts(userId?: string) {
  return useQuery({
    queryKey: ["payouts", userId],
    queryFn: () => fetchUserPayouts(userId!),
    enabled: !!userId,
  });
}

export function useAdminPayments() {
  return useQuery({
    queryKey: ["admin-payments"],
    queryFn: fetchAdminPayments,
    refetchInterval: 30_000,
  });
}

export function useDisputes() {
  return useQuery({
    queryKey: ["disputes"],
    queryFn: fetchDisputes,
    refetchInterval: 30_000,
  });
}

export function useDriverEarnings(userId?: string) {
  return useQuery({
    queryKey: ["driver-earnings", userId],
    queryFn: () => fetchDriverEarnings(userId!),
    enabled: !!userId,
    refetchInterval: 60_000,
  });
}

export function useReorderCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, order }: { userId: string; order: { items?: { listing_id: string; quantity: number }[] } }) =>
      reorderFromOrder(userId, order),
    onSuccess: (_, { userId }) => qc.invalidateQueries({ queryKey: ["cart", userId] }),
  });
}

export function useTransportJobs(driverProfileId?: string) {
  return useQuery({
    queryKey: ["transport-jobs", driverProfileId],
    queryFn: () => loadTransportJobs(driverProfileId!),
    enabled: !!driverProfileId,
    refetchInterval: 15_000,
    retry: 2,
  });
}
