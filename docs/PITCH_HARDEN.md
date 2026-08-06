# Pre-pitch harden list (Team Titan)

Last updated: 2026-08-06  
Goal: look sharp on **trust + corridor logistics**, not feed polish.

## Channels (locked)

- **Alerts:** in-app + web push (+ email if account has one)  
- **No SMS** — not in product, not in pitch  
- **No WhatsApp** — disabled in `notifyUser`; don’t demo or claim it  

## Already solid

- Pay → match → POD → payout loop  
- Manual QA on live  
- Corridor lock + landing constraints (no fake testimonials)  
- Mapbox / Paystack / Supabase keys on Vercel  
- Driver KYC + admin disputes foundation  
- Comment moderation API + RLS (client insert locked)  
- WhatsApp/SMS off in product + UI copy  

---

## P0 — before pitch (you own this)

| # | Part | Harden how |
|---|------|------------|
| 1 | Field proof | `OUTREACH` ≥5 farmers + ≥5 kitchens — fill the table |
| 2 | Pitch script | One-liner in `JUDGE_FEEDBACK.md` + 3-min demo in `DEMO_REHEARSAL.md` |
| 3 | Seller dry-run | Studio post &lt;2 min on phone |
| 4 | Verification story | Driver KYC + listing AI + POD + disputes (one admin dry-run) |
| 5 | Confirm live | Landing constraints live on agrolink-omega |

## P1 leftovers

| Part | Status |
|------|--------|
| Local `.env.local` | Optional — backup paste if offline demo |
| Dispute resolve rehearsal | Admin UI dry-run once |

## Skip

APK · GH Actions · SMS · WhatsApp · cold storage · new crops  

## Demo day

- [ ] Tomato + leafy listings  
- [ ] 1 approved driver online  
- [ ] Two devices  
- [ ] Mapbox tiles (not Leaflet fallback)  
- [ ] Offline screenshots backup  
