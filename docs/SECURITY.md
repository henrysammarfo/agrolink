# AgroLink Security

## Threat model

| Threat | Mitigation |
|--------|------------|
| Unauthorized data access | Supabase RLS on every table |
| Payment fraud | Server-side Paystack init; webhook HMAC verify; idempotency keys |
| Fake listings | OpenAI moderation before publish; admin review queue |
| Driver location spoofing | RLS: driver can only update own `driver_profiles` row |
| XSS | React auto-escape; CSP headers in Nitro config |
| Secret exposure | Payment/AI keys server-only; never in client bundle |
| Webhook replay | Idempotency key on `payments`; duplicate webhook ignored |
| Brute force auth | Supabase rate limits + application rate limit middleware |

## RLS summary

- `listings`: public read (active only); owner write
- `orders`: buyer, seller, driver, admin only
- `payments`: **no client writes** — service role only
- `driver_profiles`: public read (available drivers); owner write location
- `deliveries`: participants only
- `audit_log`: admin read only; service role insert

## Webhook verification

### Paystack

Verify `x-paystack-signature` header using HMAC SHA512 with webhook secret.
Implemented in `src/server/paystack.ts` (`verifyPaystackSignature`).

### Hubtel (when enabled)

Verify callback signature per Hubtel docs before updating order status.

## PII handling

- MoMo numbers stored in `profiles.momo_number` — access restricted by RLS
- Phone numbers: self-read/update only
- Ghana Card: not stored until Hubtel verify integration

## Incident response

1. Rotate compromised API keys immediately
2. Check `audit_log` for suspicious admin actions
3. Disable affected user accounts via Supabase Auth
4. Notify affected users via in-app notification

## Pen-test checklist

- [ ] Attempt to read another user's orders (should fail RLS)
- [ ] Attempt to insert payment row from client (should fail RLS)
- [ ] Replay Paystack webhook with wrong signature (should 401)
- [ ] SQL injection in listing title (Zod validation blocks)
- [ ] XSS in comment text (React escapes; CSP blocks inline scripts)
- [ ] Rate limit: 100 listing creates in 1 minute (should 429)
