# AgroLink

**Farm-to-city marketplace for Ghana's agricultural corridor** — TikTok-style produce feed, MoMo checkout, Bolt-style driver delivery, and one account for buyers, farmers, and drivers.

Built for the Greater Accra corridor (Dodowa → Tema → Accra) with live Supabase backend, Paystack payments, and free-tier comms (Resend email + Meta WhatsApp).

---

## Live stack

| Layer | Technology |
|-------|------------|
| Frontend | [TanStack Start](https://tanstack.com/start) + React 19 + Tailwind 4 |
| Backend | Supabase (Postgres, Auth, Storage, Realtime) |
| Server | Nitro API routes + TanStack server functions |
| Payments | Paystack (MTN MoMo test/live) |
| Maps & routing | Leaflet + OpenStreetMap + OSRM (free) |
| AI | OpenAI (moderation + pricing), TinyFish (market data) |
| Comms | Resend (email), Meta WhatsApp Cloud API, Web Push (VAPID) |
| Analytics | PostHog, Sentry |
| Deploy | Vercel (Nitro `vercel` preset) |

---

## Quick start

### Prerequisites

- Node.js 20+
- Supabase project ([dashboard](https://supabase.com/dashboard))
- API keys — see [docs/API_KEYS.md](docs/API_KEYS.md)

### Setup

```bash
git clone https://github.com/henrysammarfo/agrolink.git
cd agrolink
npm install

cp .env.example .env
# Fill in Supabase + API keys (see docs/API_KEYS.md)

npm run db:migrate    # apply migrations to remote Supabase
npm run seed:demo     # upload demo media + seed 3 corridor listings

npm run dev           # http://localhost:5173
```

### Verify

```bash
npm run build
npm run test:keys     # smoke-test external APIs
npm run stress:comms  # API routes (server on :3000)
npm run test:e2e      # full Playwright + integration suite
```

---

## Project structure

```
agrolink/
├── src/
│   ├── routes/           # TanStack file-based routes + /api/*
│   ├── components/       # UI (market, transport, admin, chat…)
│   ├── server/           # Server-only: paystack, comms, AI, WhatsApp
│   ├── lib/              # Client utils, feed algorithm, auth, API clients
│   └── integrations/     # Supabase + Lovable auth
├── supabase/migrations/  # Postgres schema + RLS
├── scripts/              # migrate, seed, e2e, screenshots
├── public/               # PWA, demo media, icons
└── docs/                 # Architecture, deploy, security, QA
```

---

## User roles (one account)

| Mode | Path | What you do |
|------|------|-------------|
| **Buyer** | `/app/buyer/feed` | TikTok-style feed, cart, MoMo checkout, live tracking |
| **Farmer** | `/app/farmer` | Post listings, fulfill orders, view payouts |
| **Driver** | `/app/transport` | Register, go online, accept jobs, POD photo |
| **Admin** | `/app/admin` | Payments, disputes, listings, surge pricing |

Enable Seller/Driver modes in **Settings** — no separate signup.

---

## Key features

- **Vertical feed** — snap-scroll produce cards with like, comment, save, add-to-cart
- **AI moderation** — OpenAI screens listings before publish
- **Dynamic delivery quotes** — OSRM distance + weight + vehicle + surge pricing
- **Escrow payments** — Paystack charge → driver payout on delivery complete
- **Realtime tracking** — driver location + route polyline for buyers
- **Comms hub** — in-app inbox, chat attachments, email, WhatsApp, web push
- **⌘K search** — global search across listings, farmers, orders
- **PWA** — installable on mobile; Capacitor scaffold for future native

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build (Nitro) |
| `npm run db:migrate` | Apply Supabase migrations via pooler |
| `npm run seed:demo` | Seed demo farmers + listings + storage media |
| `npm run upload:media` | Upload listing images to Supabase Storage |
| `npm run vapid:generate` | Generate web push keys |
| `npm run test:keys` | Smoke-test all configured API keys |
| `npm run test:e2e` | Full E2E + integration tests |
| `npm run stress:comms` | API stress/smoke tests |
| `npm run screenshots` | Capture marketing screenshots (Playwright) |

---

## Deploy

**Vercel:** see [docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md) — env vars, Supabase auth URLs, Paystack webhooks.

**Database:** migrations run locally with `npm run db:migrate` (not on Vercel build).

---

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, data flow, API map |
| [docs/API_KEYS.md](docs/API_KEYS.md) | All env vars + setup guides |
| [docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md) | Vercel deployment checklist |
| [docs/MEMORY.md](docs/MEMORY.md) | Project source of truth / phase status |
| [docs/QA_CHECKLIST.md](docs/QA_CHECKLIST.md) | Manual + automated QA |
| [docs/SECURITY.md](docs/SECURITY.md) | RLS, webhooks, threat model |
| [docs/FEED_ALGORITHM.md](docs/FEED_ALGORITHM.md) | Feed ranking formula |
| [docs/UX_REFERENCE.md](docs/UX_REFERENCE.md) | UX patterns (TikTok, Bolt, Uber) |
| [docs/PWA.md](docs/PWA.md) | Progressive Web App setup |
| [docs/OSS_REFERENCE.md](docs/OSS_REFERENCE.md) | Open-source references |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Dev workflow + PR checklist |

---

## License

Private — [henrysammarfo/agrolink](https://github.com/henrysammarfo/agrolink)
