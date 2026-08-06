# AgroLink UI revamp spec

Last updated: 2026-07-27  
Branch: `cursor/nav-unmix-cc54` (ask before push)

## Locked decisions

1. Landing `/` stays. Logged-in home = **Feed** (`/app/buyer/feed`).
2. Checkout = **pay first → match driver** (Bolt/DoorDash).
3. Comments/share = **RightDrawer** (desktop right / mobile bottom).
4. No TikTok clones without AgroLink use case.
5. Farmer alerts = **in-app + web push** (+ email). **No SMS. No WhatsApp** for launch/pitch.
6. Admin: human **driver KYC**; auto listings + POD payouts.
7. **Three modes** — Market / Studio / Drive (not mashed into one sidebar).

## Mode map

| Mode | Home | Chrome |
|------|------|--------|
| Market (shop) | `/app/buyer/feed` | `AppShell` + `FeedDesktopShell` |
| Studio (sell) | `/app/farmer` | `SellerStudioLayout` only |
| Drive | `/app/transport` | `AppShell` transport nav |

**Home rule:** post-login / `/app` / `roleHome` → For You (unless Drive-only or Admin). Studio via Create or **Open Studio**. Enable Sell → `/app/create`.

Signed-in `/market` redirects to `/app/buyer/feed` (guests stay public).

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| 0 Spec + memory | Done | This file + MEMORY / FINAL_FACTCHECK |
| 1 Shell + drawer + pay-then-match | Done | AppShell slim, RightDrawer, cart/paystack |
| 2 Seller Studio + Mapbox pins + admin/spacing | Done | `SellerStudioLayout`, `map-icons` HTML markers |
| 3 Routing cleanup + polish | Done | buyer→feed, own-slug→profile, Drive HUD |
| 4 Nav unmix | Done | No SELLER_NAV in Market; Studio Shop escape; tab active fixes |

## Seller Studio map (TikTok Studio → AgroLink)

| Studio | AgroLink |
|--------|----------|
| Upload (+) | `/app/create` (Studio chrome when farmer) |
| Home | `/app/farmer` overview |
| Content/Posts | `/app/farmer/listings` |
| Analytics / Sales | `/app/farmer/orders` |
| Monetization | `/app/farmer/payouts` |
| Inbox | `/app/inbox` |
| Escape (mobile) | Shop → `/app/buyer/feed` |

## Routing

| From | To |
|------|----|
| Exact `/app/buyer` | `/app/buyer/feed` |
| Own `/app/users/$slug` | `/app/profile` |
| Own `/app/users/$slug/followers` | `/app/profile/followers` |
| `/discover` | `/market` |
| Signed-in `/market` | `/app/buyer/feed` |

## Checkout state machine

```
Cart → Fulfillment → Pay (MoMo) → Match driver → Track → POD → Auto payouts
```

## Do / don’t

**Do:** Feed-first, separate Studio chrome, right drawers, Mapbox icons, clear money.  
**Don’t:** Dual fat sidebars, Studio items in Market nav, Overview-as-home, driver-before-pay, GitHub Actions CI.
