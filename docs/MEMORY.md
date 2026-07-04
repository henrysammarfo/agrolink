# AgroLink Memory — Source of Truth

Last updated: 2026-07-04

## Stack (actual, not build guide)

- **Frontend:** TanStack Start + React 19 + Tailwind 4 + shadcn/ui
- **Backend:** Supabase (Postgres, Auth, Storage, Realtime)
- **Server:** TanStack Start server functions + Nitro API routes for webhooks
- **Maps:** Leaflet + OpenStreetMap + OSRM (free routing)
- **Payments:** Paystack primary, Hubtel secondary
- **AI:** OpenAI (moderation + pricing), TinyFish (market data), Venice optional fallback only

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| Memory docs | Done | This file + siblings in `/docs` |
| DB schema | Done | Migration `20260704120000_marketplace_core.sql` |
| Unified auth | Done | Single signup; Shop/Sell/Drive toggles in settings |
| Live create | Done | Storage upload + moderation gate + DB insert |
| Live feed | Done | DB-backed FeedPlayer + fair ranking |
| Payments | Done | Paystack MoMo + webhook handler |
| Logistics | Done | Realtime driver location + OSRM routes |
| AI layer | Done | OpenAI moderation, price advice, TinyFish ingest |
| Security + QA | Done | RLS, rate limits, CI gate, checklist |

## What is LIVE (no mocks in production paths)

- Auth: Supabase email/password + Google OAuth
- Listings: Supabase `listings` table + Storage buckets
- Feed: `feed_rank` view + engagement tables
- Cart/orders: `carts`, `cart_items`, `orders`, `order_items`
- Payments: Paystack charge + webhook confirmation
- Driver: `driver_profiles` + `deliveries` + Realtime
- Inbox: `notifications` + `messages`
- Bookmarks/likes/comments: Supabase tables (not localStorage)

## Demo mode

Set `VITE_DEMO_MODE=true` to enable offline demo user on `/app/*` without login.
**Production must set `VITE_DEMO_MODE=false` or omit it.**

## Known gaps (post-MVP)

- Native React Native app (deferred — PWA first)
- Twi language toggle (deferred)
- Live streaming (deferred)
- Ghana Card verification UI (needs Hubtel verify keys)
- Paystack Transfers for automated farmer payouts (manual trigger in admin for now)

## Key decisions

1. Do NOT rebuild Express/Prisma/React Native — extend current Supabase stack
2. Venice uncensored models are NOT used for content moderation
3. Paystack is primary payment gateway (test mode: MTN `0551234987`)
4. Unified TikTok-style account — no role picker at signup
