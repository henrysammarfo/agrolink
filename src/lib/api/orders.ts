import { supabase } from "@/integrations/supabase/client";
import type { OrderRow, DeliveryRow } from "@/lib/types/marketplace";
import { apiFetch } from "@/lib/api/fetch-auth";
import { fetchOpenDeliveries, fetchDriverActiveDeliveries, loadTransportJobs } from "@/lib/api/transport-jobs";

export async function fetchBuyerOrders(buyerId: string): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      items:order_items(*, listing:listings(title, image_url)),
      delivery:deliveries(*, driver:driver_profiles(*, profile:profiles!driver_profiles_user_id_fkey(display_name, avatar_url, phone, slug, username)))
    `,
    )
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as OrderRow[];
}

export async function fetchSellerOrders(sellerId: string): Promise<OrderRow[]> {
  const { data: items, error } = await supabase
    .from("order_items")
    .select("order_id")
    .eq("seller_id", sellerId);
  if (error) throw error;
  const orderIds = [...new Set((items ?? []).map((i) => i.order_id))];
  if (!orderIds.length) return [];

  const { data, error: oErr } = await supabase
    .from("orders")
    .select(
      `
      *,
      items:order_items(*, listing:listings(title, image_url)),
      delivery:deliveries(*, driver:driver_profiles(*, profile:profiles!driver_profiles_user_id_fkey(display_name, avatar_url, phone, slug, username)))
    `,
    )
    .in("id", orderIds)
    .order("created_at", { ascending: false });
  if (oErr) throw oErr;
  return (data ?? []) as OrderRow[];
}

export async function fetchOrderById(orderId: string): Promise<OrderRow | null> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      items:order_items(*, listing:listings(title, image_url)),
      delivery:deliveries(*, driver:driver_profiles(*, profile:profiles!driver_profiles_user_id_fkey(display_name, avatar_url, phone, slug, username)))
    `,
    )
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw error;
  return data as OrderRow | null;
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId);
  if (error) throw error;
}

export async function fetchAvailableDeliveries(): Promise<DeliveryRow[]> {
  return fetchOpenDeliveries();
}

export async function fetchDriverDeliveries(driverProfileId: string): Promise<DeliveryRow[]> {
  return fetchDriverActiveDeliveries(driverProfileId);
}

export { loadTransportJobs };

export async function acceptDelivery(deliveryId: string, driverProfileId: string) {
  const res = await apiFetch("/api/deliveries/accept", {
    method: "POST",
    body: JSON.stringify({ deliveryId, driverProfileId }),
  });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Could not accept job");
}

export async function declineDelivery(deliveryId: string, driverProfileId: string) {
  const res = await apiFetch("/api/deliveries/decline", {
    method: "POST",
    body: JSON.stringify({ deliveryId, driverProfileId }),
  });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Could not decline job");
}

export async function advanceDeliveryStatus(
  deliveryId: string,
  status: string,
  extra?: Record<string, unknown>,
) {
  const { error } = await supabase
    .from("deliveries")
    .update({ status, ...extra, updated_at: new Date().toISOString() })
    .eq("id", deliveryId);
  if (error) throw error;
}

export async function subscribeToDelivery(
  deliveryId: string,
  callback: (payload: DeliveryRow) => void,
) {
  const channel = supabase
    .channel(`delivery:${deliveryId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "deliveries", filter: `id=eq.${deliveryId}` },
      (payload) => callback(payload.new as DeliveryRow),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export async function completeDeliveryViaApi(
  deliveryId: string,
  _userId: string,
  podPhotoUrl?: string,
) {
  const res = await apiFetch("/api/deliveries/complete", {
    method: "POST",
    body: JSON.stringify({ deliveryId, podPhotoUrl }),
  });
  const data = (await res.json()) as { error?: string; message?: string };
  if (!res.ok) throw new Error(data.error ?? "Complete failed");
  return data;
}

export async function subscribeToDriverLocation(
  driverProfileId: string,
  callback: (payload: { current_lat: number; current_lng: number }) => void,
) {
  const channel = supabase
    .channel(`driver:${driverProfileId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "driver_profiles",
        filter: `id=eq.${driverProfileId}`,
      },
      (payload) => {
        const row = payload.new as { current_lat: number | null; current_lng: number | null };
        if (row.current_lat != null && row.current_lng != null) {
          callback({ current_lat: row.current_lat, current_lng: row.current_lng });
        }
      },
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
