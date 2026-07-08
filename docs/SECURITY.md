# AgroLink Security

Last updated: 2026-07-07

## Threat model

| Threat | Mitigation |
|--------|------------|
| Unauthorized data access | Supabase RLS on every table |
| API impersonation | JWT verification on `/api/*` — never trust `userId` from body/query |
| Payment fraud | Server-side Paystack init; webhook HMAC verify; idempotency keys |
| Fake listings | OpenAI moderation before publish; admin review queue |
| Driver location spoofing | RLS: driver can only update own `driver_profiles` row |
| XSS | React auto-escape; CSP headers in Nitro config |
| Secret exposure | Payment/AI keys server-only; never in client bundle |
| Webhook replay | Idempotency key on `payments`; duplicate webhook ignored |
| Brute force auth | Supabase rate limits + application rate limit middleware |
| Storage abuse | Upload paths scoped to `{auth.uid()}/` per bucket policy |

## Architecture: single marketplace (not multi-tenant)

AgroLink is **one shared marketplace**, not org-scoped SaaS. Isolation is **per user** (buyer, seller, driver), not per tenant.

| Scope | Model |
|-------|--------|
| User data | RLS + JWT on API routes |
| Admin role | Platform-wide (payments, disputes, surge pricing) — intentional |
| Search | Public listings/farmers; orders only when JWT present |
| Demo seed | `service_role` bypasses storage RLS for `demo/*` assets |

## API authentication

Server routes use `src/server/api-auth.ts`:

| Helper | Use |
|--------|-----|
| `requireAuth` | Valid Supabase JWT required; returns `userId` from token |
| `requireAdmin` | JWT + `admin` role in `user_roles` |
| `requireRole` | JWT + specific role |
| `optionalAuth` | Public route; enrich response when logged in |
| `requireCronSecret` | `Authorization: Bearer CRON_SECRET` for cron jobs |

Client calls use `apiFetch()` from `src/lib/api/fetch-auth.ts` to attach the session JWT.

### Protected routes (JWT required)

- `/api/checkout` — buyer from JWT; email must match account if provided
- `/api/settings/notifications` — own profile only
- `/api/chat/send` — sender from JWT
- `/api/otp/send`, `/api/otp/verify`
- `/api/push/register`
- `/api/delivery/quote`
- `/api/deliveries/complete`
- `/api/verify/ghana-card`
- `/api/comms/notify`
- `/api/moderate` — auth for moderate/price_advice; admin for ingest
- `/api/admin/pricing` — admin for GET and PATCH

### Special access

- `/api/deliveries/reassign-expired` — cron secret **or** transport/admin JWT
- `/api/search/global` — public; orders filtered by JWT user when present
- `/api/webhooks/paystack` — HMAC signature (no JWT)

### Server env for JWT verification

Set on Vercel (server):

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_PUBLISHABLE_KEY`)
- `CRON_SECRET` — random string for Vercel cron / internal jobs

## RLS summary

- `listings`: public read (active only); owner write
- `orders`: buyer, seller, driver, admin only
- `payments`: **no client writes** — service role only
- `driver_profiles`: public read (available drivers); owner write location
- `deliveries`: participants only
- `audit_log`: admin read only; service role insert

## Storage scoping

| Bucket | Path rule |
|--------|-----------|
| `listing-images` | `{user_id}/…` — owner upload/update/delete |
| `listing-videos` | `{user_id}/…` — owner upload/update/delete |
| `chat-attachments` | `{user_id}/…` |
| `driver-documents` | `{user_id}/…` |
| `delivery-pod` | `{user_id}/…` — driver POD photos |
| `driver-documents` | `{user_id}/…` — owner upload; admin read for verification |

Migrations: `20260707220000_storage_owner_scoped.sql`, `20260707230000_storage_driver_pod_scoped.sql`

## Webhook verification

### Paystack

Verify `x-paystack-signature` header using HMAC SHA512 with webhook secret.
Implemented in `src/server/paystack.ts` (`verifyPaystackSignature`).

### Hubtel (when enabled)

Verify callback signature per Hubtel docs before updating order status.

## PII handling

- MoMo numbers stored in `profiles.momo_number` — access restricted by RLS
- Phone numbers: self-read/update only
- Ghana Card: verified via API; stored on driver profile after auth

## Rate limiting

Per-route in-memory limits on `/api/*` (keyed by JWT prefix + IP + path):

| Route tier | Limit / minute |
|------------|----------------|
| Webhooks | 100 |
| Checkout, OTP | 10 |
| Chat, moderate | 15 |
| Default | 30 |

For multi-instance production scale, move to Redis/Upstash. Vercel Cron runs `/api/deliveries/reassign-expired` once daily on Hobby (`0 3 * * *`); transport clients poll every 10s when drivers are active.

## Incident response

1. Rotate compromised API keys immediately
2. Check `audit_log` for suspicious admin actions
3. Disable affected user accounts via Supabase Auth
4. Notify affected users via in-app notification

## Pen-test checklist

- [ ] Attempt to read another user's orders (should fail RLS)
- [ ] Attempt to insert payment row from client (should fail RLS)
- [ ] Call `/api/checkout` without JWT (should 401)
- [ ] Call `/api/checkout` with JWT but another user's email (should 403)
- [ ] Upload listing image to another user's folder (should fail storage RLS)
- [ ] Replay Paystack webhook with wrong signature (should 401)
- [ ] SQL injection in listing title (Zod validation blocks)
- [ ] XSS in comment text (React escapes; CSP blocks inline scripts)
- [ ] Rate limit: 100 listing creates in 1 minute (should 429)
