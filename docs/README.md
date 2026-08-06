# AgroLink Documentation

Index of all project documentation.

## Getting started

| Document | Description |
|----------|-------------|
| [../README.md](../README.md) | Project overview, quick start, scripts |
| [API_KEYS.md](./API_KEYS.md) | Environment variables + provider setup |
| [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md) | Vercel deployment checklist |

## Architecture & design

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, data flow, API map, diagrams |
| [MEMORY.md](./MEMORY.md) | Source of truth — phase status, decisions |
| [JUDGE_FEEDBACK.md](./JUDGE_FEEDBACK.md) | Team Titan finals judge map + pitch responses |
| [FINAL_FACTCHECK.md](./FINAL_FACTCHECK.md) | Cite-safe PHL / corridor facts |
| [OUTREACH_CONTACTS.md](./OUTREACH_CONTACTS.md) | Farmer + kitchen interview scripts + log |
| [FEED_ALGORITHM.md](./FEED_ALGORITHM.md) | Feed ranking formula + fairness rules |
| [UX_REFERENCE.md](./UX_REFERENCE.md) | UX patterns (TikTok feed, Bolt driver, Uber tracking) |
| [COMMS.md](./COMMS.md) | In-trip chat, call, message permissions |
| [OSS_REFERENCE.md](./OSS_REFERENCE.md) | Open-source libraries referenced |

## Operations

| Document | Description |
|----------|-------------|
| [QA_CHECKLIST.md](./QA_CHECKLIST.md) | Build gate, smoke tests, manual QA flows |
| [SECURITY.md](./SECURITY.md) | RLS, webhooks, threat model, pen-test checklist |
| [BUILD_GUIDE_DELTA.md](./BUILD_GUIDE_DELTA.md) | Differences from original build guide |

## Mobile & PWA

| Document | Description |
|----------|-------------|
| [PWA.md](./PWA.md) | Progressive Web App — install, push, offline |
| [APK_BUILD.md](./APK_BUILD.md) | Capacitor/Android (deferred — PWA is primary) |

## Quick commands

```bash
npm run dev              # local dev server
npm run build            # production build
npm run db:migrate       # apply Supabase migrations
npm run seed:demo        # seed demo listings
npm run test:keys        # verify API keys
npm run test:e2e         # full E2E suite
npm run stress:comms     # API smoke tests
```
