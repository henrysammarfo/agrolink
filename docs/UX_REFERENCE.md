# UX Reference — TikTok / Bolt / Uber Parity

Last updated: 2026-07-05

AgroLink maps product patterns from consumer apps to Ghana produce logistics. This doc tracks screen parity and OSS repos — not copied UI assets.

## TikTok-style (unified account + vertical feed)

| TikTok pattern | AgroLink screen | Implementation |
|----------------|-----------------|----------------|
| Single account, creator mode toggle | Settings → Shop / Sell / Drive | `src/routes/app.settings.tsx`, `user_roles` table |
| Vertical full-screen feed | `/app/buyer/feed`, `/market` | `FeedPlayer.tsx`, `feed_rank` view |
| Profile grid (posts / liked / saved) | `/app/profile`, `/farmers/$slug` | Supabase listings + bookmarks |
| Follow / message / share | Farmer profile header | Follow UI (mutation pending) |
| For You ranking | Feed algorithm | `src/lib/feed-algorithm.ts`, `docs/FEED_ALGORITHM.md` |

**Open-source repos studied:**
- [mrthinh307/toptop](https://github.com/mrthinh307/toptop) — React Native TikTok clone (feed + auth patterns)
- [react-vertical-feed](https://www.npmjs.com/package/react-vertical-feed) — vertical swipe container reference

## Bolt / Uber rider (driver logistics)

| Uber Driver pattern | AgroLink screen | Implementation |
|---------------------|-----------------|----------------|
| Go online toggle | `/app/transport` | `driver_profiles.available`, geolocation watch |
| Document upload (license, reg, insurance) | `/app/transport/register` | `driver_documents` bucket + 5 doc types |
| Verification pending / approved | Transport gate | `VerifiedTransportGate`, `verification_status` |
| Job offer card + accept | Map bottom sheet + `/app/transport/jobs` | `deliveries` table, realtime refresh |
| Trip progress (pickup → dropoff) | Status buttons on map | `advanceDeliveryStatus` state machine |
| Earnings / payouts | Farmer + driver payouts | `payouts` table |

**Open-source repos studied:**
- [chimzyfire-ship-it/DeliveryApp](https://github.com/chimzyfire-ship-it/DeliveryApp) — React Native delivery flow
- [fleetbase/navigator-app](https://github.com/fleetbase/navigator-app) — driver navigator + job acceptance

## Uber / Bolt pricing (delivery)

| Factor | AgroLink default | Configurable |
|--------|------------------|--------------|
| Base fare | GHS 15 | `delivery_pricing_config.base_fare` |
| Per km | GHS 2.5 | `per_km_rate` |
| Weight (over 20 kg free) | GHS 0.5/kg | `per_kg_rate`, `free_kg` |
| Vehicle multiplier | Moto 1.0, pickup 1.4, truck 1.8 | `*_multiplier` columns |
| Peak hours (7–9, 17–20 weekdays) | 1.2× | `peak_multiplier` |
| Minimum fare | GHS 25 | `min_fare` |
| Platform fee | 6% | `platform_fee_pct` |

**Code:** `src/lib/delivery-pricing.ts`, `src/server/delivery-quote.ts`, `/api/delivery/quote`

Distance from OSRM (`router.project-osrm.org`), haversine fallback.

## Buyer checkout (Uber Eats–style)

| Pattern | Screen | Notes |
|---------|--------|-------|
| Cart summary + fee breakdown | `/app/buyer/cart` | Live quote before pay |
| MoMo network picker | Cart sidebar | Paystack charge |
| Live map tracking | `/app/buyer/orders` | `LiveTrackCard` + Realtime |

## Admin (Uber support console)

| Pattern | Screen |
|---------|--------|
| Payment release / refund | `/app/admin/payments` |
| Dispute timeline | `/app/admin/disputes` |
| Listing moderation | `/app/admin/listings` |

## Recommendations (next)

1. **Paystack Transfers** — automate farmer/driver payouts on `delivered` webhook
2. **Hubtel Identity** — Ghana Card OCR + verify in driver onboarding
3. **Push notifications** — FCM for job offers (Bolt-style ping)
4. **Surge pricing** — rainy season / holiday multiplier in `delivery_pricing_config`
5. **Multi-stop routes** — OR-Tools or OSRM trip API for co-op batch pickups
6. **In-app chat** — Supabase Realtime messages (UI stub exists on track card)
