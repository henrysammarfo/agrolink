# AgroLink QA Checklist

## Build gate (must pass before deploy)

```bash
bun run lint
bun run build
```

Both must exit 0.

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
