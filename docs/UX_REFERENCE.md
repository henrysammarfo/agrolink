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
| Follow / message / share | Farmer profile header | Follow live; message → chat thread | Done |
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
| Call/Message driver | `LiveTrackCard` | Done — opens chat thread |

## Search + admin

| Pattern | Screen | Status |
|---------|--------|--------|
| ⌘K command palette | App header | Done — `GlobalSearch.tsx` |
| Admin surge toggle | `/app/admin/pricing` | Done |

## Media policy

- **Production feed:** Supabase Storage URLs (`listing-images`, `listing-videos`); external CDN blocked via `media-urls.ts`
- **Seed/demo:** Run `npm run upload:media` then `npm run seed:demo` — stores under `listing-images/demo/*`
- **Client fallback:** `demo-listings.ts` builds storage URLs from `VITE_SUPABASE_URL` when DB empty
- **No Mixkit/Unsplash** in production paths

## OSS — what we actually use

| Used in repo | Reference-only (patterns) |
|--------------|---------------------------|
| `react-vertical-feed`, `react-riyils` | toptop, TikVibe, DeliveryApp |
| OSRM, Leaflet | fleetbase, expo-delivery-app |

See `docs/OSS_REFERENCE.md` for full mapping.

## Optional analytics

- PostHog: `VITE_POSTHOG_KEY` (+ optional `VITE_POSTHOG_HOST`) — events listed in `docs/API_KEYS.md`
- Sentry: `VITE_SENTRY_DSN`
- Sentry: `VITE_SENTRY_DSN` (install `@sentry/browser` when enabling)
- Web push: `VITE_VAPID_PUBLIC_KEY` for real PushManager subscriptions

## Still deferred (out of scope)

- Twi language UI
- Capacitor APK launch (`docs/APK_BUILD.md`)
- Order updates: Resend email (free) + Meta WhatsApp Cloud API (free tier) + push
- Chat image attachments
- Typing indicators

## Comms — implemented 2026-07-05

| Feature | Route / file |
|---------|----------------|
| Activity feed (notis) | `/app/inbox` activity tab |
| Conversation list | `/app/inbox` messages tab |
| Chat thread | `/app/inbox/chat/$userId` |
| Web push send | `server/comms.ts` + `web-push` |
| Unread badge | AppShell bell |
| Realtime notis | `subscribeToNotifications` |
| Realtime chat | `subscribeToMessages` |
