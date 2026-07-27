# AgroLink UI revamp spec (Phase 0)

Last updated: 2026-07-27  
Status: **Phase 1 in progress**

## Locked decisions

1. Landing `/` stays for marketing. Logged-in home = **Feed** (`/app/buyer/feed`).
2. Checkout for platform delivery = **pay first → then match driver** (Bolt/DoorDash). No unpaid driver offers.
3. Comments/share on desktop = **right drawer** bound to active listing.
4. No TikTok feature clones without AgroLink use case (no Coins, LIVE tools, Get App chrome).
5. Farmer alerts = **WhatsApp + push + email** (not SMS for launch).
6. Admin keeps **driver KYC approve**. Happy-path listings + POD payouts are automatic.

## Phase 1 scope

- Slim sticky shell + ≤5 mobile tabs (Feed-first)
- RightDrawer for comments/share
- Cart totals always visible; pay-then-match
- POD → `processOrderPayouts` (already wired; verify + surface)

## Phase 2+

- Seller Studio icon rail (Create, Listings, Sales, Comments, Payouts)
- Mapbox Drive marker/vehicle polish
- Admin restyle + routing cleanup

## Nav map (buyer / seller)

| Rail | Route |
|------|-------|
| For You | `/app/buyer/feed` |
| Cart | `/app/buyer/cart` |
| Orders | `/app/buyer/orders` |
| Inbox | `/app/inbox` |
| Profile | `/app/profile` |
| + Create | `/app/create` (seller) |
| Listings / Payouts / Sales | under Profile or Sell section (Phase 1: keep short seller links) |

## Checkout state machine

```
Cart → Fulfillment → Pay (MoMo) → Match driver → Track → POD → Auto payouts
Pickup / own_driver: Cart → Fulfillment → Pay → (no match)
```

## Do / don’t

**Do:** Feed-first, breathing room, right drawers, Mapbox for Drive, clear money totals.  
**Don’t:** Dual sidebars, Overview as home, driver-before-pay, SMS claims, unused TikTok Studio toys.
