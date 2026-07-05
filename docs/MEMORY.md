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
| Driver onboarding | Done | `/app/transport/register` — 5 documents, verification gate |
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

## Known gaps

- Native React Native app (PWA first)
- Twi language toggle
- Live streaming
- Hubtel Ghana Card verify UI (needs Hubtel keys)
- Paystack Transfers automation for farmer payouts (admin trigger for now)
- Follow/unfollow writes (UI present, needs `follows` mutation)

## Key decisions

1. Extend Supabase stack — do NOT rebuild Express/Prisma/RN from build guide
2. OpenAI for moderation — not Venice uncensored models
3. Paystack primary — test MTN `0551234987`
4. TikTok-style unified account — roles via toggles, not signup picker
5. Uber/Bolt driver flow — register → upload docs → admin approve → go online

## Open-source references (see UX_REFERENCE.md)

- TikTok feed: `mrthinh307/toptop`, `react-vertical-feed`
- Delivery: `chimzyfire-ship-it/DeliveryApp`, `fleetbase/navigator-app`
