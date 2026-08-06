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

---

## P0 — before pitch

| # | Part | Harden how |
|---|------|------------|
| 1 | Field proof | `OUTREACH` ≥5 farmers + ≥5 kitchens |
| 2 | Pitch script | One-liner + MoMo → match → track → POD; feed = discovery |
| 3 | Seller dry-run | Studio post &lt;2 min on phone |
| 4 | Verification story | Driver KYC + listing AI + POD + disputes |
| 5 | Deploy landing | Ship constraints section if not live |

## P1 — product (this pass)

| Part | Status |
|------|--------|
| Comment moderation (OpenAI + blocklist on POST) | Done |
| Track: verified driver + listed date + POD badge/photo | Done |
| WhatsApp/SMS off notify path | Done |
| Local `.env.local` | Still need backup paste (Sensitive on Vercel) |
| Dispute resolve rehearsal | You — admin UI dry-run |

## Skip

APK · GH Actions · SMS · WhatsApp · cold storage · new crops  

## Demo day

- [ ] Tomato + leafy listings  
- [ ] 1 approved driver online  
- [ ] Two devices  
- [ ] Mapbox tiles (not Leaflet fallback)  
- [ ] Offline screenshots backup  
