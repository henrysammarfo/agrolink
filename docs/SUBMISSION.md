# AgroLink — Official Hackathon Submission

## Form fields (copy-paste)

### Brief Description (≤200 words)

AgroLink is a TikTok-style farm-to-city marketplace for Ghana’s Greater Accra corridor. Farmers post photo and video listings of fresh produce; buyers swipe a vertical feed ranked by proximity, freshness, and engagement; verified transport partners deliver with live GPS tracking; and admins operate a control room for orders, payments, and moderation.

One account supports three isolated dashboards: **Market** (buyer + seller), **Transport** (driver map and jobs), and **Admin** (GMV, payouts, disputes). Checkout uses Paystack MoMo. End-to-end flow covers cart → driver matching → live track → proof-of-delivery photo → farmer payout.

Built with React, TanStack Start, Supabase (Auth, Postgres, Storage, Realtime), Google Maps (Ghana-bounded), and OpenAI listing moderation. Seeded with 26+ real produce listings and demo farmer accounts for judges.

**Live:** https://agrolink-omega.vercel.app  
**Code:** https://github.com/henrysammarfo/agrolink  
**Demo farmers:** `ama-farm@demo.agrolink.app` / `AgroLinkDemo!2026`

---

### Links checklist

| Field | URL | Status |
|-------|-----|--------|
| GitHub Repository | https://github.com/henrysammarfo/agrolink | ⚠️ **Make repo public** before submit (currently private) |
| Deployed Version | https://agrolink-omega.vercel.app | ✅ Live |
| Video Demonstration | *(add your YouTube/Loom/Drive link)* | ⚠️ **Required** — record using script below |

### Key URLs for judges (all public, no login)

| Page | URL |
|------|-----|
| Landing + live stats | https://agrolink-omega.vercel.app |
| Public market feed | https://agrolink-omega.vercel.app/market |
| Sign in / sign up | https://agrolink-omega.vercel.app/auth |
| How it works | https://agrolink-omega.vercel.app/how-it-works |
| Farmers directory | https://agrolink-omega.vercel.app/farmers |

### Logged-in demo paths

| Role | Path | Credentials |
|------|------|-------------|
| Buyer feed | `/app/buyer/feed` | Demo farmer email or Google sign-in |
| Post listing | `/app/create` | Enable **Sell** in profile first |
| Cart + delivery map | `/app/buyer/cart` | Add items from feed first |
| Driver map | `/app/transport` | Register driver → admin approve → Go live |
| Admin | `/app/admin` | `jasonneil4040@gmail.com` (team owner only) |

### Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Demo farmer (Ama) | `ama-farm@demo.agrolink.app` | `AgroLinkDemo!2026` |
| Demo farmer (Kofi) | `kofi-farm@demo.agrolink.app` | `AgroLinkDemo!2026` |
| More farmers | `*-farm@demo.agrolink.app` | `AgroLinkDemo!2026` |

---

## Video script (5–7 min)

1. **0:00** — Landing page: live stats (26 listings, 12+ sellers)
2. **0:30** — Sign in as demo farmer → `/app/create` → post produce (photo/video)
3. **1:30** — Buyer feed `/app/buyer/feed` — scroll, like, comment, mute video
4. **2:30** — Add to cart → delivery map (Greater Accra, live drivers) → MoMo checkout
5. **3:30** — Order match page → driver accepts (second device or driver account)
6. **4:30** — Live tracking + inbox chat buyer ↔ driver
7. **5:30** — Driver: turn-by-turn nav, slide confirm pickup/delivery, POD photo
8. **6:30** — Admin: orders, payments, listing moderation

Upload to **YouTube (Unlisted)** or **Loom** and paste the link in the form.

---

## Additional notes for judges (optional)

- **Corridor focus:** Maps restricted to Ghana / Greater Accra; routing via Google Maps + OSRM fallback.
- **Real data:** 26 active listings with JPG produce photos; engagement (likes/comments) from live DB, not fake counts.
- **Payments:** Paystack test mode on demo; MoMo prompt on buyer phone at checkout.
- **Local setup:** `npm install && npm run db:migrate && npm run seed:demo && npm run dev` (see `.env.example`).
- **Docs:** `docs/API_KEYS.md`, `docs/QA_CHECKLIST.md`.

---

## Before you submit

- [ ] Make GitHub repository **public**
- [ ] Upload demo video and add link to form
- [ ] Test all three links in an incognito browser
- [ ] Confirm demo farmer login works
- [ ] Check off both declaration boxes on the form
