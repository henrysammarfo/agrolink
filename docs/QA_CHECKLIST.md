# AgroLink QA Checklist

## Build gate (must pass before deploy)

```bash
npm run lint
npm run build
```

Both must exit 0. **Last verified:** 2026-07-07 — build + stress:comms + test:e2e (22/22) on `main`.

## P0–P2 parity (2026-07-05)

- [x] Self-hosted feed media — no Mixkit/Unsplash in prod (`media-urls.ts`)
- [x] Sticky mobile checkout bar on cart
- [x] Feed sans typography + double-tap like
- [x] Category chips on feed
- [x] Skeleton loaders (feed, cart, home teaser)
- [x] Dark reactive map (`CorridorMap` updates pins/route)
- [x] Driver earnings widget + slide-to-confirm
- [x] Fullscreen tracking route + OrderTracker wired
- [x] Cart uses geolocation for delivery quote
- [x] Reorder from history
- [x] Web push SW handlers + VAPID optional
- [x] Farmer profile message/share stubs

- [x] Full comms phase: notis + inbox + chat threads (2026-07-05)
- [x] Web push VAPID path (`server/comms.ts`)
- [x] Engagement notifications (like/comment/follow)
- [x] Unread badge on bell
- [x] Message farmer/driver opens chat thread
- [x] Trip chat + call buyer↔driver (2026-07-10) — see [COMMS.md](./COMMS.md)

## Production comms + media (2026-07-05)

- [x] Demo listing media uploads to Supabase Storage (`npm run upload:media`, `npm run seed:demo`)
- [x] Order updates via free Resend email + Meta WhatsApp Cloud API (no WATI/Hubtel)
- [x] Chat image attachments (upload + inline display)
- [x] ⌘K global search (listings, farmers, orders)
- [x] PostHog events: feed, checkout, driver, search, chat, admin surge
- [x] Admin surge pricing UI at `/app/admin/pricing`
- [x] Stress script: `npm run stress:comms`

## Smoke tests

### Auth
- [ ] Sign up with email only (no role picker)
- [ ] Default lands on buyer feed
- [ ] Settings → enable Seller mode → create listing works
- [ ] Settings → enable Driver mode → transport map loads

### Create + moderation
- [ ] Upload photo via + button
- [ ] Fill 5 fields and post
- [ ] Listing appears in feed within 30s
- [ ] Blocked content (test with policy-violating text) rejected with message

### Feed
- [ ] Vertical snap scroll works on mobile viewport
- [ ] Like/comment/save persist after refresh (Supabase, not localStorage)
- [ ] Add to cart from feed card

### Checkout
- [ ] Cart shows real items from DB
- [ ] Paystack test MoMo flow initiates
- [ ] Webhook confirms order → status CONFIRMED
- [ ] Delivery row auto-created

### Driver
- [ ] Driver toggles online
- [ ] Accept job updates delivery status
- [ ] Location updates visible to buyer on tracking page
- [ ] OSRM route polyline renders
- [ ] Driver can message/call buyer during active trip (phone in buyer profile)
- [ ] Buyer can message/call driver during active trip (phone in driver profile)

### Admin
- [ ] Admin dashboard shows real GMV from payments table
- [ ] Flagged listings visible in admin listings

## Stress & E2E tests

```bash
npm run dev -- --host 127.0.0.1 --port 3000   # terminal 1
npm run stress:comms   # 7 API checks
npm run test:e2e       # 22 Playwright + integration checks
npm run test:keys      # external API smoke tests
```

- [x] Search API burst (10 concurrent) — `stress-comms.mjs`
- [x] Full E2E with Supabase login — `e2e.mjs` (22/22)
- [x] OpenAI moderation + price advice via `/api/moderate`
- [x] TinyFish price ingest
- [x] Live feed from Supabase Storage URLs
- [ ] Feed with 100+ listings: scroll remains smooth
- [ ] 10 concurrent webhook deliveries: no duplicate orders (idempotency)
- [ ] 20 driver location updates/sec: Realtime channel stable

## Regression

- [ ] Public `/market` feed works without login
- [ ] Google OAuth sign-in works
- [ ] Demo mode only when `VITE_DEMO_MODE=true`
