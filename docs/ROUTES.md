# AgroLink routes — no collisions, no hidden pages

Modes stay separate. Escapes are explicit (Shop / Open Studio / Open Market).

## Public (marketing)

| Path | Notes |
|------|--------|
| `/` | Landing |
| `/market` | Public feed (signed-in → `/app/buyer/feed`) |
| `/farmers`, `/farmers/$slug` | Directory + public profile |
| `/how-it-works`, `/pricing`, `/about`, `/contact` | Site |
| `/auth` | Sign in |
| `/discover` | Alias → `/market` |

## Market (`AppShell` role=buyer)

| Path | Nav |
|------|-----|
| `/app/buyer/feed` | For You |
| `/app/buyer/cart` | Cart |
| `/app/buyer/orders` (+ track/match/success/callback) | Orders |
| `/app/buyer/payments` | Payments |
| `/app/inbox`, `/app/inbox/chat/$userId` | Inbox |
| `/app/profile` (+ followers/following/views) | Profile |
| `/app/settings` | Settings (sidebar) |
| `/app/users/$slug` | Other users (own slug → profile) |

Exact `/app/buyer` redirects to feed (`beforeLoad`).

## Studio (`SellerStudioLayout` + FarmerGate)

| Path | Rail |
|------|------|
| `/app/create` | Create |
| `/app/farmer` | Home |
| `/app/farmer/listings` (+ edit) | Posts |
| `/app/farmer/orders` | Sales |
| `/app/farmer/payouts` | Money |
| Shop escape → `/app/buyer/feed` | |

## Drive (`AppShell` role=transport)

| Path | Nav |
|------|-----|
| `/app/transport` | Map (immersive) |
| `/app/transport/jobs` | Jobs |
| `/app/transport/register` | KYC (gated) |
| Inbox / Profile | Shared chrome stays Drive |
| Shop escape → Market feed | Footer / mobile |

## Admin (`AdminPageLayout`)

| Path | Nav |
|------|-----|
| `/app/admin` | Overview |
| `/app/admin/orders` | Orders |
| `/app/admin/payments` | Payments |
| `/app/admin/pricing` | Surge |
| `/app/admin/disputes` | Disputes |
| `/app/admin/listings` | Listings |
| `/app/admin/drivers` | Drivers |

## Rules

1. One shell per mode — do not mash Studio items into Market nav.
2. Longest-prefix active tab matching (Map ≠ Jobs).
3. Shared pages keep **workspace** chrome via `useShellRole`.
4. No pages without a nav link or explicit escape (Payments + Surge were the gaps — fixed).
