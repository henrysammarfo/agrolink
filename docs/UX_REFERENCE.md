# UX Reference — TikTok / Bolt / DoorDash Parity

Last updated: 2026-07-05 (P0–P2 verified, build pass)

AgroLink maps product patterns from consumer apps to Ghana produce logistics. This doc tracks screen parity — not copied UI assets.

## TikTok-style (unified account + vertical feed)

| TikTok pattern | AgroLink screen | Implementation | Status |
|----------------|-----------------|----------------|--------|
| Single account, creator mode toggle | Settings → Shop / Sell / Drive | `app.settings.tsx`, `user_roles` | Done |
| Vertical full-screen feed | `/app/buyer/feed` | `FeedPlayer.tsx`, react-riyils + react-vertical-feed | Done |
| Double-tap like + haptic | Feed overlay | `FeedPlayer.tsx`, `haptics.ts` | Done |
| Category chips (For You filters) | Feed top bar | `CategoryChips.tsx` | Done |
| Profile grid (posts) | `/farmers/$slug` | RiyilsExplore-style 3-col grid | Done |
| Follow / message / share | Farmer profile header | Follow live; message/share toast stubs | Done |
| For You ranking | Feed algorithm | `feed-algorithm.ts` | Done |
| Sans typography in feed | Feed overlay | Serif reserved for marketing only | Done |
| Skeleton loaders | Feed, cart, home | `FeedSkeleton.tsx` | Done |

## Bolt / Uber rider (driver logistics)

| Pattern | AgroLink screen | Status |
|---------|-----------------|--------|
| Go online toggle | `/app/transport` | Done |
| Job offer + 30s countdown | Map bottom sheet | Done |
| Slide-to-confirm pickup/deliver | `SlideToConfirm.tsx` | Done |
| Earnings widget (today/week/trips) | Transport map overlay | Done |
| Dark map tiles | `CorridorMap dark` | Done |
| POD photo on complete | `PodCaptureSheet` | Done |

## DoorDash-style buyer

| Pattern | Screen | Status |
|---------|--------|--------|
| Sticky bottom checkout bar (mobile) | `/app/buyer/cart` | Done |
| Live delivery quote (geolocation drop-off) | Cart | Done |
| Full-screen order tracking | `/app/buyer/orders/$orderId/track` | Done |
| OrderTracker timeline | Orders + track page | Done |
| Reorder from history | Orders history tab | Done |
| Call/Message driver stubs | `LiveTrackCard` | Done |

## Media policy

- **Production feed:** Supabase Storage URLs only; external CDN blocked via `media-urls.ts`
- **Seed/demo:** Self-hosted `/public/media/demo/*.svg`; set `VITE_SEED_FEED=true` or run `npm run seed:demo`
- **No Mixkit/Unsplash** in production paths (removed from seed + demo listings)

## OSS — what we actually use

| Used in repo | Reference-only (patterns) |
|--------------|---------------------------|
| `react-vertical-feed`, `react-riyils` | toptop, TikVibe, DeliveryApp |
| OSRM, Leaflet | fleetbase, expo-delivery-app |

See `docs/OSS_REFERENCE.md` for full mapping.

## Optional analytics

- PostHog: `VITE_POSTHOG_KEY` (+ optional `VITE_POSTHOG_HOST`)
- Sentry: `VITE_SENTRY_DSN` (install `@sentry/browser` when enabling)
- Web push: `VITE_VAPID_PUBLIC_KEY` for real PushManager subscriptions

## Still deferred (out of scope)

- Twi language UI
- Capacitor APK launch (`docs/APK_BUILD.md`)
- Full in-app chat (inbox stub only)
