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

Run `npm run seed:demo` to populate 24+ produce listings across 6 corridor farmers with **real produce photos** (JPG) uploaded to Supabase Storage.

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

---

## Copy-paste: project description (short)

```
AgroLink is a TikTok-style farm-to-city marketplace for Greater Accra, Ghana. Buyers scroll a vertical produce feed, checkout with MTN MoMo (Paystack), and track Bolt-style drivers in real time. Farmers post listings with AI moderation; drivers go live on a map, accept jobs, chat/call buyers, and capture proof-of-delivery photos. One Supabase account powers buyer, farmer, driver, and admin dashboards.
```

## Copy-paste: project description (long)

```
AgroLink connects smallholder farmers in the Dodowa–Tema–Accra corridor with urban buyers through a mobile-first marketplace. The buyer experience mirrors TikTok: full-screen produce cards, likes, comments, saves, and one-tap add-to-cart. Checkout enforces a four-step flow for platform delivery—cart, delivery setup on a live map, driver matching before payment, then Paystack MoMo. Drivers use a Bolt-inspired map: go live, receive job offers with countdown timers, navigate with Google/OSRM routes, and communicate in-trip via chat and phone. Farmers manage a seven-step incoming orders pipeline from payment through handoff to the driver.

The stack is TanStack Start (React 19) on Vercel, Supabase for auth/data/realtime/storage, Paystack for payments and driver payouts, OpenAI for listing moderation, and Google Maps with Leaflet fallback. Row-level security, webhook-verified payments, and escrow splits protect both sides of the transaction. The app is installable as a PWA and seeded with real produce imagery for demos.

Live: https://agrolink-omega.vercel.app
Source: https://github.com/henrysammarfo/agrolink
```

## Copy-paste: tech stack field

```
React 19, TanStack Start/Router, Tailwind CSS 4, Supabase (Postgres, Auth, Realtime, Storage), Paystack MoMo, Google Maps + OSRM, OpenAI API, Resend email, Meta WhatsApp Cloud API, Vercel
```

## Copy-paste: problem statement

```
Urban buyers in Accra struggle to discover fresh, traceable produce from corridor farmers; farmers lack digital storefronts and reliable last-mile delivery. AgroLink unifies discovery (TikTok-style feed), payments (MoMo escrow), and logistics (verified drivers with live GPS) in one platform tuned for Ghana's mobile-money economy.
```

## Copy-paste: solution / impact

```
AgroLink reduces friction from farm to plate: AI-moderated listings, dynamic OSRM-based delivery quotes, driver matching before payment, live tracking with in-trip chat/call, and automatic driver payouts on delivery completion. One account can buy, sell, and drive—matching how informal agricultural trade actually works in Ghana.
```

## Copy-paste: team / contact

```
Team: AgroLink (Henry Sammarfo)
GitHub: https://github.com/henrysammarfo/agrolink
Live demo: https://agrolink-omega.vercel.app
Region: Greater Accra, Ghana
```

## Copy-paste: setup instructions (forms)

```
1. Clone https://github.com/henrysammarfo/agrolink
2. npm install && cp .env.example .env
3. Add Supabase + Paystack keys (see docs/API_KEYS.md)
4. npm run db:migrate && npm run seed:demo
5. npm run dev → http://localhost:5173
Demo login: ama-farm@demo.agrolink.app / AgroLinkDemo!2026
```

## Copy-paste: key features bullet list

```
• TikTok-style vertical produce feed with engagement ranking
• One-tap cart and 4-step MoMo checkout with driver gate before payment
• Bolt-style driver map: go live, job offers, slide-to-confirm, POD photo
• Live buyer tracking with route, ETA, chat, and call
• Farmer 7-step order pipeline and Paystack escrow payouts
• Admin control room: orders, payments, drivers, disputes, surge pricing
• PWA installable; demo seed with real corridor produce photos
```
