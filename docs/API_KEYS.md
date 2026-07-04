# AgroLink API Keys

## P0 — Required for live demo

| Variable | Feature | How to obtain |
|----------|---------|---------------|
| `VITE_SUPABASE_URL` | All DB/auth | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client auth | Same as above (anon/publishable key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Webhooks, admin, server ops | Supabase Dashboard → Settings → API (server only) |
| `OPENAI_API_KEY` | Content moderation, price advice | platform.openai.com → API keys |
| `PAYSTACK_SECRET_KEY` | MoMo checkout server-side | paystack.com → Settings → API Keys (test first) |
| `VITE_PAYSTACK_PUBLIC_KEY` | Paystack inline/popup | Same dashboard (test public key) |
| `PAYSTACK_WEBHOOK_SECRET` | Verify charge.success | Paystack Dashboard → Webhooks |

### Paystack test MoMo

- Phone: `0551234987`
- Network: MTN
- Docs: https://paystack.com/docs/payments/test-payments/

## P1 — Recommended

| Variable | Feature | How to obtain |
|----------|---------|---------------|
| `HUBTEL_CLIENT_ID` | Ghana MoMo alternate + SMS | developers.hubtel.com |
| `HUBTEL_CLIENT_SECRET` | Same | Same |
| `TINYFISH_API_KEY` | Market price scraping | agent.tinyfish.ai/api-keys |

## P2 — Optional

| Variable | Feature | How to obtain |
|----------|---------|---------------|
| `GOOGLE_MAPS_API_KEY` | Turn-by-turn nav | Google Cloud Console |
| `AFRICASTALKING_API_KEY` | SMS OTP fallback | africastalking.com |
| `WATI_API_TOKEN` | WhatsApp notifications | wati.io |
| `VENICE_API_KEY` | Backup AI (NOT moderation) | venice.ai → API |
| `AZURE_KEY_VAULT_URL` | Secret storage in prod | Azure Portal |

## Feature → key mapping

| Feature | Keys used |
|---------|-----------|
| Signup/login | Supabase only |
| Listing upload | Supabase Storage + OpenAI |
| Feed ranking | Supabase (no external key) |
| Checkout | Paystack (+ optional Hubtel) |
| Driver tracking | Supabase Realtime |
| Route ETA | OSRM (free, no key) |
| Market prices | TinyFish + OpenAI |
| Admin audit | Supabase service role |

## Environment files

Copy `.env.example` to `.env` and fill values. Never commit secrets.
