# AgroLink QA Checklist

## Build gate (must pass before deploy)

```bash
npm run lint
npm run build
```

Both must exit 0. **Last verified:** 2026-07-05 — build pass on `cursor/agrolink-production-live-cc54`.

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

### Admin
- [ ] Admin dashboard shows real GMV from payments table
- [ ] Flagged listings visible in admin listings

## Stress tests

- [ ] Feed with 100+ listings: scroll remains smooth
- [ ] 10 concurrent webhook deliveries: no duplicate orders (idempotency)
- [ ] 20 driver location updates/sec: Realtime channel stable

## Regression

- [ ] Public `/market` feed works without login
- [ ] Google OAuth sign-in works
- [ ] Demo mode only when `VITE_DEMO_MODE=true`
