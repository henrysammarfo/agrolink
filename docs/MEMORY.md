# AgroLink Memory — Source of Truth

Last updated: 2026-07-05

## Stack (actual, not build guide)

- **Frontend:** TanStack Start + React 19 + Tailwind 4 + shadcn/ui
- **Backend:** Supabase (Postgres, Auth, Storage, Realtime)
- **Server:** TanStack Start server functions + Nitro API routes (`/api/checkout`, `/api/delivery/quote`, `/api/webhooks/paystack`)
- **Maps:** Leaflet + OpenStreetMap + OSRM (free routing)
- **Payments:** Paystack primary (MoMo), Hubtel secondary
- **AI:** OpenAI (moderation + pricing), TinyFish (market data)

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| Memory docs | Done | MEMORY, UX_REFERENCE, API_KEYS, BUILD_GUIDE_DELTA, FEED_ALGORITHM, SECURITY, QA |
| DB schema v1 | Done | `20260704120000_marketplace_core.sql` |
| DB schema v2 | Done | `20260705010000_driver_verification_pricing.sql` — driver docs, disputes, payouts, pricing config |
| Unified auth | Done | Single signup; Shop/Sell/Drive toggles in settings |
| Live create | Done | Storage + moderation + DB |
| Live feed | Done | `feed_rank` + engagement tables |
| Payments | Done | Paystack + dynamic delivery quote at checkout |
| Delivery pricing | Done | Bolt/Uber-style: base, km, kg, vehicle, peak, min fare — `src/lib/delivery-pricing.ts` |
| Driver onboarding | Done | Register + Hubtel Ghana Card verify + doc upload |
| Auto payouts | Done | Paystack Transfers on delivery complete |
| Driver push | Done | FCM + in-app notify on new paid jobs |
| Surge pricing | Done | `surge_multiplier` in pricing config |
| Follow system | Done | Live toggle on farmer profiles |
| OSS library | Done | `docs/OSS_REFERENCE.md` — TikTok, Bolt, Uber, Yango, DoorDash |
| Extra recommendations | Done | See below |
| Logistics | Done | Realtime driver location + OSRM + verified driver gate |
| Admin | Done | Live payments + disputes from Supabase |
| Marketing pages | Done | Home, farmers directory — Supabase-backed, no mock-data.ts |
| Remove mocks | Done | `mock-data.ts` deleted; all routes wired to Supabase |

## What is LIVE

- Auth, listings, feed, cart, orders, Paystack checkout with OSRM delivery fee
- Driver registration + document upload + `verification_status` gate
- Transport map/jobs (approved drivers only)
- Farmer dashboard, orders, payouts
- Buyer dashboard, cart, orders, live tracking
- Admin payments, disputes, listings moderation
- Public farmers directory + TikTok-style profile pages

## Demo mode

`VITE_DEMO_MODE=true` — demo user on `/app/*` without login. **Production: omit or false.**

## Extra recommendations (implemented 2026-07-05)

| Feature | Status | Implementation |
|---------|--------|----------------|
| react-vertical-feed TikTok scroll | Done | `FeedPlayer.tsx` + immersive `/app/buyer/feed` shell |
| 30s job accept + auto-reassign | Done | `accept_deadline`, `JobAcceptCountdown`, `/api/deliveries/reassign-expired` |
| Paystack subaccounts escrow | Done | `paystack-subaccounts.ts`, split at MoMo charge, release on delivery |
| Multi-farm batch routing | Done | `batch-routing.ts` OSRM multi-stop + cart co-op quote |
| Hubtel SMS OTP (GHS 500+) | Done | `/api/otp/send`, `/api/otp/verify`, cart UI |
| Premium app UX | Done | TikTok immersive feed nav, Bolt countdown sheets |
| Capacitor / APK scaffold | Done | `capacitor.config.ts`, `manifest.webmanifest`, `docs/APK_BUILD.md` |
| react-riyils gesture feed | Done | Swiper physics in fullscreen `FeedPlayer` |
| POD photo on deliver | Done | `PodCaptureSheet`, `delivery-pod` bucket, `pod_photo_url` |
| Capacitor geolocation | Done | `@capacitor/geolocation` + `native-geolocation.ts` |
| Demo feed seed | Done | `demo-listings.ts` + `scripts/seed-demo-listings.mjs` |
| Brand app icons | Done | `public/icons/` from BrandMark gradient |

## P0–P2 UX parity (verified 2026-07-05, `npm run build` pass)

| Priority | Feature | Status | Files |
|----------|---------|--------|-------|
| P0 | Self-hosted feed media (no Mixkit/Unsplash in prod) | Done | `media-urls.ts`, `public/media/demo/*`, `demo-listings.ts` |
| P0 | Sticky mobile checkout bar | Done | `app.buyer.cart.tsx` |
| P0 | Feed overlay sans typography | Done | `FeedPlayer.tsx` — Inter/sans in overlay |
| P0 | Double-tap like + haptic | Done | `FeedPlayer.tsx`, `haptics.ts` |
| P0 | Seed listings when DB empty | Done | `VITE_DEMO_MODE` or `VITE_SEED_FEED=true` |
| P0 | Full-bleed feed (no sidebar) | Done | `AppShell.tsx` `IMMERSIVE_PATHS` |
| P0 | Skeleton loaders (feed/cart/teaser) | Done | `FeedSkeleton.tsx` |
| P1 | Dark map tiles + reactive CorridorMap | Done | `CorridorMap.tsx` |
| P1 | Driver earnings widget | Done | `fetchDriverEarnings`, `app.transport.tsx` |
| P1 | Slide-to-confirm pickup/deliver | Done | `SlideToConfirm.tsx` |
| P1 | Fullscreen order tracking | Done | `/app/buyer/orders/$orderId/track` |
| P1 | OrderTracker wired | Done | `app.buyer.orders.tsx`, `buildTrackedOrder()` |
| P1 | Cart delivery coords from geolocation | Done | `getCurrentPosition()` in cart |
| P2 | Web push polish (SW + VAPID) | Done | `push-client.ts`, `sw.js` |
| P2 | PostHog/Sentry optional init | Done | `analytics.ts`, `VITE_POSTHOG_KEY`, `VITE_SENTRY_DSN` |
| P2 | RiyilsExplore grid on farmer profile | Done | `farmers.$slug.tsx` |
| P2 | Category chips on feed | Done | `CategoryChips.tsx` |
| P2 | Reorder from past orders | Done | `reorderFromOrder`, history table |
| P2 | Message/Share stubs | Done | `farmers.$slug.tsx`, `LiveTrackCard.tsx` |

## Full comms phase (verified 2026-07-05, build pass)

| Feature | Status | Implementation |
|---------|--------|----------------|
| Central notify + web push | Done | `server/comms.ts`, `web-push` VAPID |
| Engagement notis (like/comment/follow) | Done | `/api/comms/notify`, wired in `engagement.ts` |
| Order/delivery push | Done | Paystack webhook + `delivery-complete.ts` via `notifyUser` |
| Realtime activity inbox | Done | `subscribeToNotifications`, unread badge on bell |
| Conversation list | Done | `ConversationList.tsx`, grouped by partner |
| Chat threads | Done | `/app/inbox/chat/$userId`, `ChatThread.tsx` |
| Realtime messages | Done | `subscribeToMessages` Supabase channel |
| Message farmer/driver | Done | Profile + track card → chat route |
| VAPID key generator | Done | `npm run vapid:generate` |

## Production comms + media batch (2026-07-05)

| Priority | Feature | Status | Implementation |
|----------|---------|--------|----------------|
| 1 | Listing media → Supabase Storage | Done | `scripts/upload-listing-media.mjs`, `seed-demo-listings.mjs` uploads to `listing-images/demo/*`; `demo-listings.ts` uses storage URLs when `VITE_SUPABASE_URL` set |
| 2 | WhatsApp order updates (Meta Cloud API) + email (Resend) | Done | `server/whatsapp.ts`, `server/email-notify.ts`, `comms.ts`; no WATI/Hubtel |
| 3 | Chat image attachments | Done | `messages.attachment_url`, `chat-attachments` bucket, `ChatThread.tsx` upload + display |
| 4 | ⌘K global search | Done | `GlobalSearch.tsx`, `/api/search/global`, `AppShell` trigger (desktop + mobile) |
| 5 | PostHog event wiring | Done | `feed_*`, `driver_*`, `checkout_initiated`, `search`, `chat_message_sent`, `admin_surge_updated` |
| 6 | Admin surge pricing UI | Done | `/app/admin/pricing`, `/api/admin/pricing` PATCH |

Migration: `20260705120000_comms_media_search.sql`

Stress tests: `npm run stress:comms`

## Launch path: PWA (not APK)

Production mobile = **installable PWA** over HTTPS. See `docs/PWA.md`.

Capacitor/APK is **deferred** — config kept for a later phase only.

## Key decisions

1. Extend Supabase stack — do NOT rebuild Express/Prisma/RN from build guide
2. OpenAI for moderation — not Venice uncensored models
3. Paystack primary — test MTN `0551234987`
4. TikTok-style unified account — roles via toggles, not signup picker
5. Uber/Bolt driver flow — register → upload docs → admin approve → go online

## Open-source references (see UX_REFERENCE.md)

- TikTok feed: `mrthinh307/toptop`, `react-vertical-feed`
- Delivery: `chimzyfire-ship-it/DeliveryApp`, `fleetbase/navigator-app`
