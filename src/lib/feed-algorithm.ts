import type { FeedListing } from "@/lib/types/marketplace";

const EARTH_RADIUS_KM = 6371;

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function proximityScore(distanceKm: number): number {
  return 1 / (1 + distanceKm / 10);
}

export function computeFeedScore(
  listing: FeedListing,
  buyerLat?: number,
  buyerLng?: number,
): number {
  const hoursOld = (Date.now() - new Date(listing.created_at).getTime()) / 3_600_000;
  const freshness = Math.max(0, 1 - hoursOld / 168);
  const engagement = Math.min(
    1,
    (listing.like_count * 0.5 +
      listing.comment_count * 2 +
      listing.save_count * 1.5 +
      listing.view_count * 0.01) /
      100,
  );
  const trust =
    (listing.seller_verified ? 0.4 : 0) + ((listing.seller_rating ?? 0) / 5) * 0.4 + 0.2;
  const demand = listing.ai_demand_score ?? 0.5;
  const spamPenalty = Math.min(
    0.5,
    ((listing as FeedListing & { report_count?: number }).report_count ?? 0) * 0.1,
  );

  let proximity = 0.5;
  if (buyerLat != null && buyerLng != null) {
    proximity = proximityScore(haversineKm(buyerLat, buyerLng, listing.lat, listing.lng));
  }

  const explorationBoost =
    (listing as FeedListing & { seller_listing_count?: number }).seller_listing_count != null &&
    (listing as FeedListing & { seller_listing_count?: number }).seller_listing_count! <= 10
      ? 0.15
      : 0;

  return (
    0.35 * proximity +
    0.25 * freshness +
    0.2 * engagement +
    0.1 * trust +
    0.1 * demand -
    spamPenalty +
    explorationBoost
  );
}

export function rankListings(
  listings: FeedListing[],
  buyerLat?: number,
  buyerLng?: number,
): FeedListing[] {
  return [...listings]
    .map((l) => {
      const distance_km =
        buyerLat != null && buyerLng != null
          ? haversineKm(buyerLat, buyerLng, l.lat, l.lng)
          : undefined;
      const score = computeFeedScore({ ...l, distance_km }, buyerLat, buyerLng);
      return { ...l, distance_km, feed_score: score };
    })
    .sort((a, b) => b.feed_score - a.feed_score || a.id.localeCompare(b.id));
}

export const FEED_ALGORITHM_COPY =
  "Score = 35% proximity + 25% freshness + 20% engagement + 10% seller trust + 10% AI demand − spam penalty + exploration boost for new sellers. Deterministic, not random.";
