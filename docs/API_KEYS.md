# AgroLink API Keys

## P0 — Required for live demo

| Variable | Feature | How to obtain | Free? |
|----------|---------|---------------|-------|
| `VITE_SUPABASE_URL` | All DB/auth | Supabase Dashboard → Settings → API | Yes (free tier) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client auth | Same | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Webhooks, admin, seed | Same (server only) | Yes |
| `OPENAI_API_KEY` | Moderation + price advice | platform.openai.com | Paid (you have credits) |
| `VITE_PAYSTACK_PUBLIC_KEY` | MoMo checkout | paystack.com → Test keys | Test free |
| `PAYSTACK_SECRET_KEY` | Checkout server | Same | Test free |
| `PAYSTACK_WEBHOOK_SECRET` | Order confirmation | Paystack Webhooks | Free |

## P1 — Free comms stack (replaces WATI + Hubtel)

| Variable | Feature | How to obtain | Free tier |
|----------|---------|---------------|-----------|
| `RESEND_API_KEY` | Order emails + checkout OTP | [resend.com](https://resend.com) → API Keys | **3,000 emails/month** |
| `RESEND_FROM_EMAIL` | Sender address | Verify domain or use `onboarding@resend.dev` for testing | Free |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp order updates | [developers.facebook.com](https://developers.facebook.com) → WhatsApp → API Setup | **1,000 conversations/month** |
| `WHATSAPP_ACCESS_TOKEN` | Meta Cloud API token | Same dashboard (System User or temp token) | Free tier |
| `WHATSAPP_API_VERSION` | Graph API version | Default `v21.0` | — |
| `VITE_VAPID_PUBLIC_KEY` | Web push (PWA) | `npm run vapid:generate` | **Free** |
| `VAPID_PRIVATE_KEY` | Web push signing | Same script | **Free** |
| `VAPID_SUBJECT` | Web push contact | `mailto:support@agrolink.app` | Free |
| `FCM_SERVER_KEY` | Native driver push | Firebase Console → Cloud Messaging | **Free** |
| `VITE_POSTHOG_KEY` | Analytics | posthog.com | **1M events/month** |
| `TINYFISH_API_KEY` | Market prices | agent.tinyfish.ai | You have access |

## P1 — Maps (Mapbox primary)

| Variable | Feature | How to obtain | Free? |
|----------|---------|---------------|-------|
| `VITE_MAPBOX_ACCESS_TOKEN` | Mapbox GL JS client maps | [account.mapbox.com](https://account.mapbox.com) → Access tokens (public, URL-restrict) | Free tier |
| `MAPBOX_ACCESS_TOKEN` | Directions, Geocoding, Map Matching (server) | Same token or a secret token | Free tier |

Rotate Mapbox tokens after finals. Do not commit `.env.local`.

## P2 — Optional

| Variable | Feature | Free? |
|----------|---------|-------|
| `VITE_SENTRY_DSN` | Error tracking | Free tier |
| `GOOGLE_MAPS_API_KEY` / `VITE_GOOGLE_MAPS_API_KEY` | Legacy fallback only | GCP credits |
| `VENICE_API_KEY` | Backup AI | Paid |

## Removed (no longer needed)

| Old key | Replaced by |
|---------|-------------|
| Google Maps as primary map stack | Mapbox GL JS + Directions / Geocoding / Matching |
| `WATI_API_TOKEN` | Meta WhatsApp Cloud API (direct, free) |
| `WATI_API_URL` | Meta Graph API |
| `HUBTEL_CLIENT_ID` (SMS) | Resend email (free) |
| `HUBTEL_CLIENT_SECRET` (SMS) | Resend email (free) |
| Hubtel Ghana Card API | Admin manual review (free, format check only) |

## Notification priority (all free at MVP scale)

1. **In-app** — always (Supabase)
2. **Web push** — VAPID + FCM (free)
3. **Email** — Resend (3k/month free)
4. **WhatsApp** — Meta Cloud API (1k convos/month free)

## Setup guides

### Resend (5 min)
1. Sign up at resend.com
2. Create API key → `RESEND_API_KEY`
3. For production: verify your domain → set `RESEND_FROM_EMAIL=AgroLink <orders@yourdomain.com>`
4. For testing: use `onboarding@resend.dev` (sends to your Resend account email only)

### Meta WhatsApp Cloud API (15 min)
1. Create Meta Business account
2. developers.facebook.com → Create App → Business → Add WhatsApp
3. Copy **Phone number ID** → `WHATSAPP_PHONE_NUMBER_ID`
4. Generate **Access token** → `WHATSAPP_ACCESS_TOKEN`
5. Add test phone numbers in WhatsApp → API Setup for dev
6. First 1,000 service conversations/month are free

## PostHog events (wired)

See previous list in repo — `feed_*`, `driver_*`, `checkout_initiated`, `search`, etc.

## Demo scripts

```bash
npm run vapid:generate   # free web push keys
npm run upload:media       # Supabase storage
npm run seed:demo          # seed listings
```
