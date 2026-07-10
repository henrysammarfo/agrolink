# AgroLink

**Farm-to-city marketplace for Ghana's agricultural corridor** — TikTok-style produce feed, MoMo checkout, Bolt-style driver delivery, and one account for buyers, farmers, and drivers.

**Live:** https://agrolink-omega.vercel.app  
**Repo:** https://github.com/henrysammarfo/agrolink

Built for Greater Accra (Dodowa → Tema → Accra) with Supabase, Paystack, Google Maps routing, and free-tier comms (Resend + WhatsApp Cloud).

---

## What you can do

| Role | Start here | Highlights |
|------|------------|------------|
| **Buyer** | `/app/buyer/feed` | Feed, cart, 4-step checkout (Cart → Delivery → Driver → Payment), live track, chat/call driver |
| **Farmer** | `/app/farmer/listings` | Post produce, 7-step incoming orders pipeline, payouts |
| **Driver** | `/app/transport` | Go live on map, accept jobs, navigate, chat/call buyer, POD photo |
| **Admin** | `/app/admin` | Orders, payments, drivers, disputes, surge pricing |

One account — enable Seller/Driver in **Settings** (`/app/settings`).

---

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | TanStack Start + React 19 + Tailwind 4 |
| Backend | Supabase (Postgres, Auth, Storage, Realtime) |
| API | Nitro routes under `/api/*` |
| Payments | Paystack (MTN MoMo) |
| Maps | Google Maps JS + Leaflet/OSRM fallback |
| AI | OpenAI moderation + pricing |
| Comms | In-app chat, Resend email, WhatsApp Cloud, Web Push |
| Deploy | Vercel |

---

## Quick start

```bash
git clone https://github.com/henrysammarfo/agrolink.git
cd agrolink
npm install
cp .env.example .env    # fill keys — see docs/API_KEYS.md
npm run db:migrate
npm run seed:demo
npm run dev             # http://localhost:5173
```

### Verify before deploy

```bash
npm run build
npm run stress:order-flow
npm run test:keys
```

---

## Checkout flow (platform delivery)

1. **Cart** — review items  
2. **Delivery** — map, address, vehicle, **Request driver**  
3. **Driver** — wait for accept (map + cancel trip); session persisted in localStorage  
4. **Payment** — Paystack MoMo after driver accepts  

Pickup-only orders skip the driver step.

---

## Chat & call during delivery

- **Buyer track page** — phone + message buttons; in-trip chat on full-screen track  
- **Driver transport map** — call/message buyer from trip sheet  
- Requires **phone in Profile** (`/app/profile`) for calls  
- See [docs/COMMS.md](docs/COMMS.md)

---

## Project structure

```
agrolink/
├── src/routes/           # Pages + /api/* handlers
├── src/components/       # UI (feed, track, transport, admin…)
├── src/server/           # Paystack, comms, driver matching, AI
├── src/lib/              # Client utils, order lifecycle, enrich helpers
├── supabase/migrations/  # Postgres schema + RLS
├── scripts/              # migrate, seed, e2e, stress tests
└── docs/                 # Architecture, deploy, QA, comms
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run db:migrate` | Apply Supabase migrations |
| `npm run seed:demo` | Demo farmers + listings |
| `npm run stress:order-flow` | Order lifecycle step tests |
| `npm run test:keys` | Smoke-test API keys |
| `npm run test:e2e` | Playwright + integration |

---

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/README.md](docs/README.md) | Full doc index |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design + API map |
| [docs/COMMS.md](docs/COMMS.md) | Chat, call, trip permissions |
| [docs/API_KEYS.md](docs/API_KEYS.md) | Environment variables |
| [docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md) | Vercel deploy checklist |
| [docs/SUBMISSION.md](docs/SUBMISSION.md) | Hackathon copy-paste forms |
| [docs/QA_CHECKLIST.md](docs/QA_CHECKLIST.md) | Manual + automated QA |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Branch workflow |

---

## Demo accounts

| Email | Password | Role |
|-------|----------|------|
| `ama-farm@demo.agrolink.app` | `AgroLinkDemo!2026` | Farmer |
| `e2e@agrolink.app` | `AgroLinkE2e!2026` | Admin / E2E |

Run `npm run seed:demo` for corridor listings with real produce photos.

---

## License

Private — [henrysammarfo/agrolink](https://github.com/henrysammarfo/agrolink)
