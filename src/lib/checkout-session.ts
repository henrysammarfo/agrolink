import type { FulfillmentMode } from "@/lib/fulfillment";
import type { MapLocation } from "@/lib/api/maps";

export type CheckoutSession = {
  step: 1 | 2 | 3 | 4;
  pendingOrderId: string | null;
  driverMatched: boolean;
  matchedDriverName: string | null;
  deliveryLocation: MapLocation;
  fulfillmentMode: FulfillmentMode;
  selectedVehicle: "bicycle" | "motorcycle" | "car";
  savedAt: number;
};

const TTL_MS = 45 * 60 * 1000;

function key(userId: string) {
  return `agrolink:checkout:${userId}`;
}

export function loadCheckoutSession(userId: string): CheckoutSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return null;
    const session = JSON.parse(raw) as CheckoutSession;
    if (Date.now() - session.savedAt > TTL_MS) {
      localStorage.removeItem(key(userId));
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveCheckoutSession(userId: string, session: Omit<CheckoutSession, "savedAt">) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key(userId), JSON.stringify({ ...session, savedAt: Date.now() }));
  } catch {
    /* quota */
  }
}

export function clearCheckoutSession(userId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key(userId));
}
