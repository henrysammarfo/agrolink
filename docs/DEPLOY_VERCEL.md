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
| `MAPBOX_ACCESS_TOKEN` | Directions / Geocoding / Matching (server) |
| `VITE_MAPBOX_ACCESS_TOKEN` | Mapbox GL JS (public token, URL-restrict) |
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

**No GitHub Actions** — org billing blocks workflows. Do not add `.github/workflows` CI or cron.

Use **Supabase pg_cron** (runs inside your database, every 5 min):

```bash
# 1. Apply migration (once)
npm run db:migrate

# 2. After Vercel deploy — set your live URL + secret
SITE_URL=https://YOUR-PROJECT.vercel.app CRON_SECRET=your-secret npm run cron:configure
```

This stores config in `internal_cron_config` and pg_cron POSTs to  
`/api/deliveries/reassign-expired` with `Authorization: Bearer $CRON_SECRET`.

**Free fallback (no Supabase cron):** [cron-job.org](https://cron-job.org)

1. Create free account → **Create cronjob**
2. URL: `https://YOUR-PROJECT.vercel.app/api/deliveries/reassign-expired`
3. Method: **POST**
4. Header: `Authorization: Bearer YOUR_CRON_SECRET`
5. Schedule: every **5 minutes**

**Always on:** transport drivers poll the same endpoint every **10s** while the app is open.

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

### Google OAuth (Supabase — required for “Continue with Google”)

1. [Supabase Dashboard → Authentication → Providers → Google](https://supabase.com/dashboard/project/mhyuzmhzockexqmnyuze/auth/providers) — enable Google and paste Client ID + Secret from [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. In Google Cloud, add **Authorized redirect URI**:
   - `https://mhyuzmhzockexqmnyuze.supabase.co/auth/v1/callback`
3. In Supabase **URL Configuration**, add redirect URLs:
   - `https://YOUR-DOMAIN/**`
   - `https://YOUR-DOMAIN/auth`
4. Set `VITE_SITE_URL` and `SITE_URL` to your live domain on Vercel.

Email sign-up: if **Confirm email** is enabled in Supabase, users must click the link before first sign-in.

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
