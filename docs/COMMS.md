# AgroLink — Comms (Chat & Call)

How buyers and drivers communicate during an active trip.

## Overview

| Channel | Buyer → Driver | Driver → Buyer |
|---------|----------------|----------------|
| **In-app chat** | Track page, orders list, inbox | Transport map trip sheet, inbox |
| **Phone call** | `tel:` link (profile phone or MoMo number) | `tel:` link (buyer profile phone) |
| **Push / email** | Order updates via `server/comms.ts` | New job notifications |

Chat during an **active delivery** bypasses the follow/message-request gate. Outside a trip, users need mutual follow or an accepted message request.

## Active trip chat (permissions)

Server: `src/server/message-permissions.ts` → `hasActiveDeliveryChat()`

Allowed delivery statuses:

- `requested` (driver assigned, pre-payment checkout)
- `driver_assigned`
- `driver_enroute_pickup`
- `picked_up`
- `enroute_delivery`

Both participants must be the order **buyer** and the delivery's **assigned driver** (`driver_profiles.user_id`).

API: `POST /api/chat/send` with `{ orderId, deliveryId }` in the body (see `src/lib/api/chat.ts`).

## UI entry points

### Buyer

1. **Full-screen track** — `/app/buyer/orders/$orderId/track`
   - Phone button → driver `profiles.phone` or `driver_profiles.momo_number`
   - Message button → opens in-trip chat panel
2. **Embedded track card** — orders list / buyer home
   - Same call/message buttons + collapsible `ChatThread`
3. **Inbox** — `/app/inbox/chat/$userId?order=<orderId>&delivery=<deliveryId>`

### Driver

1. **Transport map** — `/app/transport` → `TransportTripSheet`
   - Call → buyer `profiles.phone`
   - Message → inbox with order + delivery context
2. **Inbox** — same chat route as buyer

## Phone numbers

| Role | Source field | Where to set |
|------|--------------|--------------|
| Buyer | `profiles.phone` | Settings → Profile |
| Driver | `profiles.phone` or `driver_profiles.momo_number` | Settings / driver onboarding |

Helper: `src/lib/trip-contact.ts`

- `normalizeGhPhone()` — E.164 for Ghana (+233…)
- `dialPhone()` — mobile opens dialer; desktop copies number to clipboard

## Data loading fixes

PostgREST cannot join `driver_profiles` → `profiles` via FK (both link to `auth.users`). Order and job APIs use `src/lib/order-enrich.ts`:

- `attachDriverProfiles()` — buyer orders API
- `attachBuyerProfiles()` — driver active/open jobs

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| "Message request sent" during trip | Missing `orderId` / `deliveryId` on send | Open chat from track page or URL with `?order=` |
| "Driver phone not available" | Empty profile phone + MoMo | Driver adds phone in Profile |
| "Buyer phone not in profile" | Buyer has no phone | Buyer adds phone in Settings |
| "Buyer not available yet" (driver) | Active job missing `order.buyer_id` | Fixed in `fetchDriverActiveDeliveries` embed |
| Chat empty after send | RLS / auth | Sign in; check Supabase Realtime enabled on `messages` |

## Related files

- `src/components/track/LiveTrackCard.tsx` — buyer track UI
- `src/components/transport/TransportTripSheet.tsx` — driver trip sheet
- `src/components/chat/ChatThread.tsx` — thread UI + send
- `src/routes/app.inbox.chat.$userId.tsx` — dedicated chat page
- `src/server/comms.ts` — send pipeline + notifications
