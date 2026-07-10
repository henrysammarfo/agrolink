# Contributing to AgroLink

## Development setup

1. Clone the repo and install dependencies: `npm install`
2. Copy `.env.example` → `.env` and fill in keys ([API_KEYS.md](./docs/API_KEYS.md))
3. Apply migrations: `npm run db:migrate`
4. Seed demo data: `npm run seed:demo`
5. Start dev server: `npm run dev`

## Branch workflow

- **`main`** — production-ready; deploys to Vercel
- Feature branches: `cursor/<description>-cc54` for agent work
- Do **not** force-push or rebase commits already on `main`

## Before opening a PR

```bash
npm run build
npm run stress:comms    # with dev server on :3000
npm run test:e2e        # full suite
```

## Code conventions

- Match existing patterns in surrounding files
- Server secrets in `src/server/` or `/api/*` — never `VITE_*` except public keys
- Supabase admin client only in server modules
- Minimal diffs — don't refactor unrelated code in the same PR

## Documentation

When adding features, update:

- `docs/MEMORY.md` — phase status
- `docs/ARCHITECTURE.md` — if data flow or API changes
- `docs/API_KEYS.md` — if new env vars
- `docs/QA_CHECKLIST.md` — if new test flows

## Secrets

Never commit `.env`. Rotate keys if exposed. See [SECURITY.md](./docs/SECURITY.md).
