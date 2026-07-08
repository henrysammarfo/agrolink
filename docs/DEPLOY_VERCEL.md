# Deploy AgroLink on Vercel

AgroLink uses **TanStack Start + Nitro**. On Vercel, Nitro auto-detects the platform and outputs `.vercel/output` (no manual output directory needed).

## 1. Import project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import **henrysammarfo/agrolink** from GitHub
3. Framework: **Other** (or leave auto-detect)
4. **Build command:** `npm run build`
5. **Install command:** `npm install`
6. **Output directory:** leave empty — Nitro writes `.vercel/output` automatically when `VERCEL=1`

If the build targets Cloudflare instead of Vercel, add env var:

```
NITRO_PRESET=vercel
```

## 2. Environment variables

In **Vercel → Project → Settings → Environment Variables**, add everything from your local `.env`.

### Required (production)

| Variable | Notes |
|----------|-------|
| `VITE_SUPABASE_URL` | Same as `SUPABASE_URL` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client key |
| `SUPABASE_URL` | Server |
| `SUPABASE_PUBLISHABLE_KEY` | Auth middleware |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only — never expose to client |
| `OPENAI_API_KEY` | Moderation + price advice |
| `VITE_PAYSTACK_PUBLIC_KEY` | Test: `pk_test_…` |
| `PAYSTACK_SECRET_KEY` | Test: `sk_test_…` |
| `PAYSTACK_WEBHOOK_SECRET` | From Paystack webhook settings |
| `RESEND_API_KEY` | Order emails + OTP |
| `RESEND_FROM_EMAIL` | e.g. `AgroLink <onboarding@resend.dev>` |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta WhatsApp |
| `WHATSAPP_ACCESS_TOKEN` | Meta WhatsApp |
| `VITE_POSTHOG_KEY` | Analytics |
| `VITE_POSTHOG_HOST` | `https://us.i.posthog.com` (US Cloud) |
| `VITE_VAPID_PUBLIC_KEY` | Web push |
| `VAPID_PRIVATE_KEY` | Web push |
| `VITE_SENTRY_DSN` | Error tracking |
| `TINYFISH_API_KEY` | Market prices |
| `GOOGLE_MAPS_API_KEY` | Optional maps |
| `VITE_GOOGLE_MAPS_API_KEY` | Same key for client if used |
| `CRON_SECRET` | Random secret for `/api/deliveries/reassign-expired` cron (Bearer token) |

### Deploy-specific

| Variable | Value |
|----------|-------|
| `SITE_URL` | `https://YOUR-PROJECT.vercel.app` (or custom domain) |
| `VITE_SITE_URL` | Same as `SITE_URL` |
| `VITE_DEMO_MODE` | `false` |
| `VITE_SEED_FEED` | `false` (use live Supabase feed) |

**Do not** add `SUPABASE_DB_PASSWORD` to Vercel unless you run migrations from CI — migrations are run locally via `npm run db:migrate`.

### Scheduled jobs (delivery reassign)

Vercel **Hobby** cron is limited to **once per day**, so frequent reassign runs on **GitHub Actions** instead.

**GitHub → repo → Settings → Secrets and variables → Actions** — add:

| Secret | Value |
|--------|-------|
| `SITE_URL` | `https://YOUR-PROJECT.vercel.app` |
| `CRON_SECRET` | Same as Vercel `CRON_SECRET` |

Workflow: `.github/workflows/reassign-deliveries.yml` — runs every **5 minutes** and calls:

`POST /api/deliveries/reassign-expired` with `Authorization: Bearer $CRON_SECRET`

Manual run: **Actions → Reassign expired deliveries → Run workflow**.

**Also active:** transport drivers poll the same endpoint every **10s** while the transport app is open (JWT).

**Alternatives** if you prefer not to use GitHub Actions:

| Service | Notes |
|---------|--------|
| [cron-job.org](https://cron-job.org) | Free HTTP cron, hit your URL + Bearer header |
| Supabase `pg_cron` + `pg_net` | DB-native schedule (needs extension enabled) |
| Vercel Pro | Change `vercel.json` cron to `*/5 * * * *` |

## 3. After first deploy — configure external services

Replace `YOUR-DOMAIN` with your Vercel URL (e.g. `agrolink.vercel.app`).

### Supabase Auth

[Supabase Dashboard → Authentication → URL Configuration](https://supabase.com/dashboard/project/mhyuzmhzockexqmnyuze/auth/url-configuration)

- **Site URL:** `https://YOUR-DOMAIN`
- **Redirect URLs:** add:
  - `https://YOUR-DOMAIN/**`
  - `https://YOUR-DOMAIN/app`

### Paystack webhooks

[Paystack Dashboard → Settings → Webhooks](https://dashboard.paystack.com/#/settings/developer)

- **Test Webhook URL:** `https://YOUR-DOMAIN/api/webhooks/paystack`
- Copy webhook secret → `PAYSTACK_WEBHOOK_SECRET` in Vercel → redeploy

### Google OAuth (if using Lovable/Google sign-in)

Add authorized redirect URI in Google Cloud Console:

- `https://YOUR-DOMAIN`

### Resend (production email)

For real buyer emails, verify your domain at [resend.com/domains](https://resend.com/domains) and set `RESEND_FROM_EMAIL` to your domain.

## 4. Database (already done)

Migrations were applied to live Supabase. Demo data seeded via `npm run seed:demo` locally.

To re-seed after deploy:

```bash
# locally, with .env pointing at production Supabase
npm run seed:demo
```

## 5. Verify deploy

```bash
# Replace with your Vercel URL
STRESS_BASE=https://YOUR-DOMAIN npm run stress:comms
STRESS_BASE=https://YOUR-DOMAIN npm run test:e2e
```

Manual checks:

- [ ] `/` marketing home loads
- [ ] `/auth` sign-in works
- [ ] `/app/buyer/feed` shows 3 demo listings with images
- [ ] Paystack test checkout initiates
- [ ] `/api/webhooks/paystack` returns 401 without signature (proves route exists)

## 6. Custom domain (optional)

Vercel → **Domains** → add your domain → update `SITE_URL`, Supabase redirect URLs, and Paystack webhook URL to match.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build uses Cloudflare preset | Set `NITRO_PRESET=vercel` |
| Auth redirect loop | Add Vercel URL to Supabase redirect URLs |
| Empty feed | Confirm `VITE_SEED_FEED=false` and Supabase keys correct |
| API routes 404 | Ensure Nitro/Vercel preset — redeploy with `NITRO_PRESET=vercel` |
| Paystack webhook fails | Check `PAYSTACK_WEBHOOK_SECRET` matches Paystack dashboard |
