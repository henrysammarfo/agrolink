import { supabase } from "@/integrations/supabase/client";
import { apiFetch } from "@/lib/api/fetch-auth";
import { attachBuyerProfiles, collectBuyerUserIds } from "@/lib/order-enrich";
import type { DeliveryRow } from "@/lib/types/marketplace";

const ACTIVE_SELECT = `
  *,
  order:orders(buyer_id, total_amount, payment_status)
`;

async function enrichWithBuyerProfiles(rows: DeliveryRow[]): Promise<DeliveryRow[]> {
  const buyerIds = collectBuyerUserIds(rows as unknown as Parameters<typeof collectBuyerUserIds>[0]);
  if (!buyerIds.length) return rows;
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, phone, slug, username")
    .in("id", buyerIds);
  if (error) throw new Error(error.message);
  return attachBuyerProfiles(rows as never, profiles ?? []) as DeliveryRow[];
}

export async function fetchDriverActiveDeliveries(driverProfileId: string): Promise<DeliveryRow[]> {
  const { data, error } = await supabase
    .from("deliveries")
    .select(ACTIVE_SELECT)
    .eq("driver_id", driverProfileId)
    .in("status", ["driver_assigned", "driver_enroute_pickup", "picked_up", "enroute_delivery"])
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return enrichWithBuyerProfiles((data ?? []) as DeliveryRow[]);
}

/** Open jobs via API (filtered server-side) with Supabase RLS fallback. */
export async function fetchOpenDeliveries(): Promise<DeliveryRow[]> {
  try {
    const res = await apiFetch("/api/deliveries/available");
    if (res.ok) {
      const json = (await res.json()) as { deliveries?: DeliveryRow[] };
      return enrichWithBuyerProfiles(json.deliveries ?? []);
    }
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    console.warn("[jobs] /api/deliveries/available:", res.status, err.error);
  } catch (e) {
    console.warn("[jobs] /api/deliveries/available failed:", e);
  }

  const { data, error } = await supabase
    .from("deliveries")
    .select(ACTIVE_SELECT)
    .eq("status", "requested")
    .is("driver_id", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return enrichWithBuyerProfiles((data ?? []) as DeliveryRow[]);
}

export async function loadTransportJobs(driverProfileId: string): Promise<DeliveryRow[]> {
  const [openResult, activeResult] = await Promise.allSettled([
    fetchOpenDeliveries(),
    fetchDriverActiveDeliveries(driverProfileId),
  ]);

  const open = openResult.status === "fulfilled" ? openResult.value : [];
  const active = activeResult.status === "fulfilled" ? activeResult.value : [];

  if (openResult.status === "rejected") {
    console.warn("[jobs] open deliveries failed:", openResult.reason);
  }
  if (activeResult.status === "rejected") {
    console.warn("[jobs] active deliveries failed:", activeResult.reason);
  }

  if (openResult.status === "rejected" && activeResult.status === "rejected") {
    const reason = openResult.reason ?? activeResult.reason;
    throw reason instanceof Error ? reason : new Error("Could not load jobs");
  }

  return [...active, ...open.filter((a) => !active.find((m) => m.id === a.id))];
}
