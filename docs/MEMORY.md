# AgroLink Memory — Source of Truth

Last updated: 2026-08-06

## Active focus (finals)

- **Judge response:** `docs/JUDGE_FEEDBACK.md` + `docs/FINAL_FACTCHECK.md` + `docs/PITCH_CARD.md`
- **Pre-pitch harden:** `docs/PITCH_HARDEN.md`
- **Routes map:** `docs/ROUTES.md` — Market / Studio / Drive / Admin stay separate; no hidden pages
- **Field validation:** `docs/OUTREACH_CONTACTS.md` — ≥5 farmers + ≥5 kitchens (Henry owns walks)
- **Live:** https://agrolink-omega.vercel.app · Vercel project **`teamtitanlink/agrolink`** (`prj_74Av2rjxUU6M25F2ekGzpLOMfOFd`) — note separate project `agrolink-omega` exists but does **not** own the live domain
- **Local env:** repo linked via `vercel link`; Production/Preview vars are all **Sensitive** → `vercel env pull` cannot decrypt. Fill `.env.local` from backup or add Development non-Sensitive copies on Vercel.
- **No GitHub Actions CI** — billing blocked; Vercel builds only (do not re-add workflows)
- **Defer:** native APK, crop expansion beyond tomato/leafies, multi-corridor scale
- **SMS / WhatsApp:** off — alerts = in-app + web push (+ email). Do not pitch either. Product UI/copy aligned (settings toggle removed; how-it-works / create / contact updated).
- **Comments:** insert only via moderated `/api/listings/comments` — RLS migration applied on production.
- **Anon listings GRANT:** migration `20260806150000_grant_listings_select_anon` — landing featured sellers also via `/api/stats/public-sellers` (avoids client 401).
- **Own-profile routes:** `/app/users/$slug` (+ followers) use `<Navigate>` (no `throw redirect` in render).
- **Next (P0):** field outreach ≥5+5 + pitch rehearsal — see `OUTREACH_CONTACTS.md` + `JUDGE_FEEDBACK.md` one-liner + `PITCH_CARD.md`.

## Scope lock (say this)

> We help peri-urban Dodowa-corridor farmers move **tomato and leafy greens** to **Accra restaurants and chop bars** by solving **same-day pickup, MoMo settlement, and proof of delivery**.

| | |
|--|--|
| Model | B2B food-service (not D2C consumers) |
| Innovation | Fulfillment + MoMo escrow + POD accountability |
| Feed | Buyer discovery UX only |
| Checkout | Pay MoMo → match driver → track → POD → auto payouts |

## Stack (actual)

- **Frontend:** TanStack Start + React 19 + Tailwind 4 + shadcn/ui
- **Backend:** Supabase (Postgres, Auth, Storage, Realtime)
- **Server:** Nitro `/api/*` + `src/server/*`
- **Maps:** Mapbox GL JS + Directions / Geocoding / Matrix / Matching (Leaflet+OSRM fallback). `docs/MAPBOX_MEMORY.md`
- **Payments:** Paystack MoMo + subaccount escrow
- **Comms:** In-app + Web Push + Resend email (WhatsApp/SMS off)
- **AI:** OpenAI listing moderation (+ optional price advice — demote in pitch)
- **Deploy:** Vercel — `docs/DEPLOY_VERCEL.md`
- **Feed:** Embla / Riyils in `FeedPlayer.tsx`
- **Mobile:** PWA first (`docs/PWA.md`); Capacitor scaffold deferred

## UI revamp (merged)

| Phase | Status | Notes |
|-------|--------|-------|
| 1–3 Shell, Studio, polish | Done | PR #48 |
| 4 Nav unmix Market / Studio / Drive | Done | PR #50 |
| Theme / Drive escape / feed sticky | Done | PR #52 |
| Profile badge + notif polish | Done | PR #53 |
| Types from migrations | Done | PR #51 |
| Drop GH Actions | Done | PR #49 |

## Proven loops (2026-08)

| Loop | Status |
|------|--------|
| Paid order → match → POD → payout | Done (manual on live) |
| Manual QA checklist on live | Done (team) |
| Fictional landing testimonials removed | Done — replaced with corridor constraint cards |
| ≥5 farmer + ≥5 kitchen interviews | Open — tracker in OUTREACH |

## What is LIVE

- Auth, listings, feed, cart, pay-then-match Paystack checkout
- Driver register → docs → admin KYC → go live → accept → POD
- Farmer Studio (listings, orders, payouts)
- Buyer track + in-trip chat/call
- Admin: orders, payments, drivers, listings, disputes, surge
- Public farmers directory + profiles
- Marketing landing: honest constraints section (no fake quotes)

## Admin role (pitch clarity)

| Automatic | Human admin |
|-----------|-------------|
| Listing moderation → live | Driver KYC approve/reject |
| MoMo pay → driver offers | Disputes / refunds |
| POD → Paystack transfer splits | Surge config, payment audit |

## Comms honesty

| Channel | Status |
|---------|--------|
| In-app notifications | Live |
| Web push | Live (VAPID) |
| Email (Resend) | Live when account has email |
| WhatsApp Cloud | **Off** — code kept, not called from `notifyUser` |
| SMS | **Not used** |

## Demo mode

`VITE_DEMO_MODE=true` — offline demo only. **Production: false.**

## Key decisions

1. Stay on Supabase — do not rebuild Express/Prisma/RN  
2. OpenAI for moderation — not Venice for trust path  
3. Paystack primary  
4. Unified account + workspace toggles  
5. Uber/Bolt driver gate: register → docs → admin → online  
6. Feed is discovery; logistics + trust is the product  

## Open docs

| Doc | Use |
|-----|-----|
| `JUDGE_FEEDBACK.md` | Finals Q&A map |
| `FINAL_FACTCHECK.md` | Cite-safe PHL / corridor facts |
| `OUTREACH_CONTACTS.md` | Field interview scripts + log |
| `DEMO_REHEARSAL.md` | Live walkthrough |
| `QA_CHECKLIST.md` | Regression |
| `SECURITY.md` | JWT / RLS / webhook |

## Deferred

- Capacitor APK  
- Multi-crop / multi-region expansion  
- GitHub Actions CI  
- Cold storage / aggregation hubs (own as gap — not solved)
