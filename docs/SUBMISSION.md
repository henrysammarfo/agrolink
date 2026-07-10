# AgroLink — Hackathon Submission Guide

## Links

| Item | URL |
|------|-----|
| **Source code** | https://github.com/henrysammarfo/agrolink |
| **Live app** | https://agrolink-omega.vercel.app |
| **Demo video** | Record 3–7 min walkthrough using script below |

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Demo farmer | `ama-farm@demo.agrolink.app` | `AgroLinkDemo!2026` |
| Demo farmer | `kofi-farm@demo.agrolink.app` | `AgroLinkDemo!2026` |
| E2E / admin | `e2e@agrolink.app` | `AgroLinkE2e!2026` |

Run `npm run seed:demo` to populate 24+ produce listings across 6 corridor farmers.

## Core workflows (for demo video)

### 1. Farmer registration and produce upload
- Sign up at `/auth` → enable Sell mode in Profile or `/app/create`
- Post photo/video listing with price, quantity, location, hashtags
- AI moderation auto-approves safe listings → appears in feed
- Edit or delete your listings at `/app/farmer/listings` (TikTok-style)

### 2. Buyer search and interaction
- Browse vertical feed at `/app/buyer/feed` (proximity + engagement algorithm)
- Global search (⌘K): produce, farmers, hashtags
- Like, comment, save, follow sellers

### 3. End-to-end marketplace
- Add to cart → checkout with Paystack MoMo
- Track order live at `/app/buyer/orders`
- Payment history at `/app/buyer/payments`
- Seller fulfills at `/app/farmer/orders`; payouts at `/app/farmer/payouts`

### 4. Transport and delivery
- Driver registers at `/app/transport/register`
- Admin approves driver at `/app/admin/drivers`
- Driver goes live on map → accepts jobs → live GPS tracking for buyer
- POD photo on delivery complete

### 5. Admin control room
- `/app/admin` — GMV, orders, listings stats
- `/app/admin/orders` — platform order audit
- `/app/admin/payments` — release / refund payments
- `/app/admin/listings` — approve / reject listings
- `/app/admin/disputes` — dispute resolution

## Three dashboards

1. **Market** — buyer + seller (one mode; seller toggle in profile)
2. **Transport** — driver map, jobs, go live
3. **Admin** — operations, payments, moderation

## Tech stack

- Frontend: React, TanStack Router, Tailwind, Vite
- Backend: TanStack Start server routes, Supabase (Postgres + Auth + Storage + Realtime)
- Payments: Paystack MoMo
- Maps: Google Maps JS + Leaflet fallback, Ghana-bounded corridor
- AI: OpenAI moderation + price advice

## Setup (judges / local)

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run seed:demo
npm run dev
```

## Suggested demo video script (5 min)

1. 0:00 — Landing page, sign in as demo farmer
2. 0:45 — Post a new tomato listing (camera + price)
3. 1:30 — Switch to buyer feed — scroll algorithm-ranked produce
4. 2:15 — Search, add to cart, MoMo checkout
5. 3:00 — Live order tracking map
6. 3:45 — Driver view: go live, accept delivery
7. 4:30 — Admin: orders + payments audit
