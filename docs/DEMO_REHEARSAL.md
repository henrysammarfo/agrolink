# Finals demo rehearsal checklist

Live pitch = 3–5 min walkthrough + Q&A. Demo video already submitted.

## Before you leave

- [ ] Paste Mapbox tokens into `.env.local` and Vercel (`MAPBOX_ACCESS_TOKEN`, `VITE_MAPBOX_ACCESS_TOKEN`)
- [ ] `VITE_DEMO_MODE=false` on production
- [ ] `npm run seed:demo` if feed/listings look empty
- [ ] Approve at least one driver in `/app/admin/drivers`
- [ ] Put real phones on buyer + driver profiles (for call demo)
- [ ] Dual device / two browsers: buyer account + driver account logged in
- [ ] Offline backup: screenshots of feed, checkout driver card, live track, admin GMV

## Happy-path script

1. Landing → sign in as farmer → post a listing (or use seeded produce)
2. Switch / open buyer feed — swipe one item at a time (no skip)
3. Add to cart → Delivery → Request driver → wait for accept → **DriverProfileCard** shows
4. Pay with Paystack test MoMo
5. Buyer track: phase copy “Heading to farm” then “Bringing your order” on Mapbox
6. Driver app: go live → accept → slide pickup → POD
7. Admin: orders + payments audit

## Accounts

| Role | Email | Password |
|------|-------|----------|
| Farmer | `ama-farm@demo.agrolink.app` | `AgroLinkDemo!2026` |
| E2E / admin | `e2e@agrolink.app` | `AgroLinkE2e!2026` |

## After finals

Rotate Mapbox + other API keys.
