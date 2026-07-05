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

## Known gaps

- Native React Native app (Capacitor APK path documented)
- **Twi language toggle** (deferred by product decision)
- Live streaming

## Key decisions

1. Extend Supabase stack — do NOT rebuild Express/Prisma/RN from build guide
2. OpenAI for moderation — not Venice uncensored models
3. Paystack primary — test MTN `0551234987`
4. TikTok-style unified account — roles via toggles, not signup picker
5. Uber/Bolt driver flow — register → upload docs → admin approve → go online

## Open-source references (see UX_REFERENCE.md)

- TikTok feed: `mrthinh307/toptop`, `react-vertical-feed`
- Delivery: `chimzyfire-ship-it/DeliveryApp`, `fleetbase/navigator-app`
