# AgroLink API Keys

## P0 — Required for live demo

| Variable | Feature | How to obtain |
|----------|---------|---------------|
| `VITE_SUPABASE_URL` | All DB/auth | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client auth | Same as above (anon/publishable key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Webhooks, admin, server ops, media seed | Supabase Dashboard → Settings → API (server only) |
| `OPENAI_API_KEY` | Content moderation, price advice | platform.openai.com → API keys |
| `PAYSTACK_SECRET_KEY` | MoMo checkout server-side | paystack.com → Settings → API Keys (test first) |
| `VITE_PAYSTACK_PUBLIC_KEY` | Paystack inline/popup | Same dashboard (test public key) |
| `PAYSTACK_WEBHOOK_SECRET` | Verify charge.success | Paystack Dashboard → Webhooks |

### Paystack test MoMo

- Phone: `0551234987`
- Network: MTN
- Docs: https://paystack.com/docs/payments/test-payments/

## P1 — Recommended (comms + push + analytics)

| Variable | Feature | How to obtain |
|----------|---------|---------------|
| `HUBTEL_CLIENT_ID` | Ghana Card verify + MoMo alternate + WhatsApp SMS fallback | developers.hubtel.com |
| `HUBTEL_CLIENT_SECRET` | Same | Same |
| `WATI_API_TOKEN` | WhatsApp order updates (primary) | wati.io → API |
| `WATI_API_URL` | WATI server base (default `https://live-server.wati.io`) | wati.io dashboard |
| `FCM_SERVER_KEY` | Driver job push (Bolt-style) | Firebase Console → Project Settings → Cloud Messaging |
| `VITE_VAPID_PUBLIC_KEY` | Web push (PWA) public key | `npm run vapid:generate` |
| `VAPID_PRIVATE_KEY` | Web push server signing | Same script (server only) |
| `VAPID_SUBJECT` | Web push contact URI | `mailto:support@agrolink.app` |
| `VITE_POSTHOG_KEY` | Product analytics (feed, checkout, driver) | posthog.com → Project → API key |
| `VITE_POSTHOG_HOST` | PostHog ingest (default `https://app.posthog.com`) | posthog.com |
| `TINYFISH_API_KEY` | Market price scraping | agent.tinyfish.ai/api-keys |

## P2 — Optional

| Variable | Feature | How to obtain |
|----------|---------|---------------|
| `VITE_SENTRY_DSN` | Client error tracking | sentry.io → Project DSN |
| `GOOGLE_MAPS_API_KEY` | Turn-by-turn nav | Google Cloud Console |
| `AFRICASTALKING_API_KEY` | SMS OTP fallback | africastalking.com |
| `VENICE_API_KEY` | Backup AI (NOT moderation) | venice.ai → API |
| `AZURE_KEY_VAULT_URL` | Secret storage in prod | Azure Portal |

## Feature → key mapping

| Feature | Keys used |
|---------|-----------|
| Signup/login | Supabase only |
| Listing upload + demo seed media | Supabase Storage + service role |
| Feed ranking | Supabase (no external key) |
| Checkout | Paystack (+ optional Hubtel) |
| WhatsApp order updates | WATI (+ Hubtel SMS fallback) |
| Push (web + native) | VAPID + FCM |
| Driver tracking | Supabase Realtime |
| Route ETA | OSRM (free, no key) |
| Analytics | PostHog (`VITE_POSTHOG_KEY`) |
| Admin surge pricing | Supabase service role + admin role |

## PostHog events (wired)

| Event | Trigger |
|-------|---------|
| `feed_view` | Feed opens |
| `feed_like` | Like toggle |
| `feed_add_to_cart` | Add to cart from feed |
| `feed_comment` | Comment posted |
| `feed_save` | Bookmark toggle |
| `feed_share` | Share listing |
| `checkout_initiated` | Pay on cart |
| `driver_online_toggle` | Go online/offline |
| `driver_job_accept` | Accept delivery job |
| `driver_status_advance` | Pickup/en-route step |
| `driver_delivery_complete` | POD + complete |
| `search` | ⌘K global search |
| `chat_message_sent` | Chat send (incl. attachments) |
| `admin_surge_updated` | Surge pricing save |
| `notification_pref_updated` | Settings WhatsApp/push toggle |

## Environment files

Copy `.env.example` to `.env` and fill values. Never commit secrets.

## Demo scripts (need service role)

```bash
npm run upload:media   # upload /public/media/demo/* → listing-images/demo/
npm run seed:demo      # upload media + seed farmers/listings
npm run vapid:generate # generate web push keys
```
