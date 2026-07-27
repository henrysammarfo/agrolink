# AgroLink UI revamp spec

Last updated: 2026-07-27  
Branch: `cursor/ui-revamp-phase1-cc54` (local iterate — ask before push)

## Locked decisions

1. Landing `/` stays. Logged-in home = **Feed** (`/app/buyer/feed`).
2. Checkout = **pay first → match driver** (Bolt/DoorDash).
3. Comments/share = **RightDrawer** (desktop right / mobile bottom).
4. No TikTok clones without AgroLink use case.
5. Farmer alerts = WhatsApp + push + email (no launch SMS).
6. Admin: human **driver KYC**; auto listings + POD payouts.

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| 0 Spec + memory | Done | This file + MEMORY / FINAL_FACTCHECK |
| 1 Shell + drawer + pay-then-match | Done | AppShell slim, RightDrawer, cart/paystack |
| 2 Seller Studio + Mapbox pins + admin/spacing | Done | `SellerStudioLayout`, `map-icons` HTML markers, PageHeader/StatCard rhythm, admin copy |
| 3 Routing cleanup + polish | Done | Create under Studio; `/app/buyer` → feed; own `/app/users/$me` → `/app/profile`; Drive idle HUD; spacing tokens on key pages |

## Seller Studio map (TikTok Studio → AgroLink)

| Studio | AgroLink |
|--------|----------|
| Upload (+) | `/app/create` (Studio chrome when farmer) |
| Home | `/app/farmer` overview |
| Content/Posts | `/app/farmer/listings` |
| Analytics / Sales | `/app/farmer/orders` |
| Monetization | `/app/farmer/payouts` |
| Inbox | `/app/inbox` |

Chrome: [`SellerStudioLayout.tsx`](../src/components/seller/SellerStudioLayout.tsx) — 72px icon rail desktop, 5-tab mobile.

## Routing (Phase 3)

| From | To |
|------|----|
| Exact `/app/buyer` | `/app/buyer/feed` |
| Own `/app/users/$slug` | `/app/profile` |
| Own `/app/users/$slug/followers` | `/app/profile/followers` |
| `/discover` | `/market` |

## Mapbox markers

Custom HTML markers via Mapbox GL `Marker` (Tavily + Mapbox docs: custom-marker-icons).  
Kinds: farm / buyer / hub / job + driver car — [`src/lib/map-icons.ts`](../src/lib/map-icons.ts).

## Checkout state machine

```
Cart → Fulfillment → Pay (MoMo) → Match driver → Track → POD → Auto payouts
```

## Spacing tokens

`:root` in `src/styles.css`: `--space-section`, `--space-block`, `--space-tight`, `--content-max`.  
Used by `PageHeader`, profile/settings/inbox/orders, Studio create.

## Drive idle HUD

Offline: dark glass sheet on map (“Offline — map still open”) + single **Go live**.  
Online waiting: soft “Listening for jobs” (no empty-wallet dead end).

## Do / don’t

**Do:** Feed-first, breathing room, right drawers, Mapbox icons, clear money.  
**Don’t:** Dual fat sidebars, Overview-as-home, driver-before-pay, SMS claims, Coins/LIVE toys.
