# Judge feedback → AgroLink response (Team Titan)

Last updated: 2026-08-06  
Source: finals review meeting + written judge notes (Tim Titan = Team Titan).

## Locked one-liner (say this)

> We help peri-urban Dodowa-corridor farmers move **tomato and leafy greens** to **Accra restaurants and chop bars** by solving **same-day pickup, MoMo settlement, and proof of delivery**.

| Dimension | Locked answer |
|-----------|---------------|
| Crops | Tomato + leafy greens (pepper secondary) |
| Production area | Dodowa / peri-urban Greater Accra (Shai-Osudoku → Tema hop) |
| Corridor / market | Dodowa → Ashaiman/Tema → Accra food-service belt |
| Primary buyer | **Restaurants + chop bars** (B2B food-service), not retail consumers |
| Market model | Farmer → kitchen (platform logistics), not farmer → consumer D2C |
| Hard problems | Transport + payment escrow + POD / disputes — **not** “another marketplace” |
| Feed | Buyer **discovery UX** only — never pitch as the innovation |
| Farmer channel | **In-app + web push** (email if they have one). **No SMS. No WhatsApp.** |

---

## General feedback → what we do

| Judge ask | Our response |
|-----------|----------------|
| Beyond connect farmers ↔ buyers | Emphasize pay-then-match, verified drivers, live track, POD, escrow release, admin disputes |
| Narrow crop + location | Tomato + leafies on Dodowa–Tema–Accra only |
| Talk to farmers & buyers | Tracker: `docs/OUTREACH_CONTACTS.md` — ≥5 + ≥5 before finals |
| Define primary buyer | Accra food-service (restaurants / chop bars) |
| Choose B2B vs B2C | **B2B kitchen supply** — kitchen quantities, morning delivery, MoMo |
| Supply chain > AI | AI = listing moderation assist only; price advice is optional helper — demote in pitch |
| Trust & accountability | Listing moderation, comment moderation, driver KYC, POD photo, chat/call, disputes, admin refunds |

---

## Team Titan — judge notes

### Judge 1 — strengths to keep
- Dodowa–Tema–Accra corridor ✅  
- POD, driver workflows, admin ✅  

### Judge 1 — priority issues → actions

| Issue | Status | Action |
|-------|--------|--------|
| TikTok feed not central innovation | Docs + landing updated | Pitch: feed = discovery; hard system = match → MoMo → POD |
| Comments need moderation | Done | OpenAI moderations + blocklist on `POST /api/listings/comments` |
| AI price flags may mislead | Pitch discipline | Call it “optional advice”; never guarantee market price |
| Admin role unclear | Clarify | Admin = human driver KYC + disputes/refunds + surge; listings auto-moderate; POD auto-payout |
| Primary buyer unclear | Locked | Restaurants + chop bars |

### Judge 2
- Same as Judge 1 + **strengthen security / participant verification**  
- Live: JWT on `/api/*`, RLS, Ghana Card driver verify, doc upload + admin approve, Paystack webhook HMAC  
- Pitch: say who verifies (admin KYC for drivers; AI + report queue for listings)

### Judges 3–4
- Placeholder — update when notes arrive

---

## Farmer alerts (meeting vs locked product)

Judges flagged a bad video claim (email-first). Our product lock:

1. **Never** say email-first for farmers.  
2. **No SMS** and **no WhatsApp** in the pitch or notify path.  
3. **Live alerts:** in-app notifications + web push (+ Resend email when the account has an email).  
4. Demo line: *“Updates land in the app and as push — kitchens can also get email.”*

---

## Meeting action items

| Owner | Item | Status |
|-------|------|--------|
| Henry | Improve seller-side + validate with farmers before finals | In progress — Studio rail shipped; field interviews tracked in OUTREACH |
| Team Titan | Incorporate judge comments into solution + pitch | This doc + MEMORY + landing constraints section |
| Joshua Atsu | Finals date/time email | Waiting |

---

## Pitch do / don’t (quick)

**Do:** corridor · tomato/leafies · kitchens · same-day + MoMo + POD · admin KYC · seller validation stories  
**Don’t:** invent testimonials · claim TikTok is the product · claim cold storage solved · claim SMS or WhatsApp · claim 80% loss
