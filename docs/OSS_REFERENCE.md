# Open-Source Reference Library — AgroLink

Curated repos mapped to AgroLink features. **We do not fork or vendor these repos** — we adopt **patterns** and **npm libraries** where they fit our TanStack Start + Supabase stack.

## Used in production code today

| Reference | How AgroLink uses it | Code |
|-----------|----------------------|------|
| [react-vertical-feed](https://www.npmjs.com/package/react-vertical-feed) | Snap-scroll autoplay for embedded feed (discover/market) | `FeedPlayer.tsx` (non-fullscreen) |
| [react-riyils](https://github.com/illegal-instruction-co/react-riyils) | Vertical Swiper gestures, rubber-band, velocity swipes | `FeedPlayer.tsx` (fullscreen) + `riyils-overrides.css` |
| [mrthinh307/toptop](https://github.com/mrthinh307/toptop) | **Pattern:** unified auth, role toggles, follow on profiles | `auth.tsx`, `farmers.$slug.tsx`, settings |
| [TikVibe / tiktok clone](https://github.com/yns19971020-cyber/tiktok) | **Pattern:** FYP ranking weights, engagement actions | `feed_rank` view, `feed-algorithm.ts`, likes/comments |
| [DeliveryApp](https://github.com/chimzyfire-ship-it/DeliveryApp) | **Pattern:** driver doc upload, job accept flow | `/app/transport/register`, `JobAcceptCountdown` |
| [fleetbase/navigator-app](https://github.com/fleetbase/navigator-app) | **Pattern:** POD photo, map + bottom job sheet | `PodCaptureSheet`, `/app/transport` |
| [Bolt delivery app](https://github.com/bolt-delivery/bolt-delivery-app) | **Pattern:** 30s accept timer, online toggle | `delivery-reassign.ts`, transport map |
| [Deliveroo / food_ordering clones](https://github.com/adrianhajdin/food_ordering) | **Pattern:** cart → quote → MoMo → track | `app.buyer.cart`, `OrderTracker` |
| [expo-delivery-app](https://github.com/mykhayloyuminov/expo-delivery-app) | **Pattern:** realtime order push | Supabase Realtime + FCM (`server/push.ts`) |
| [OSRM](http://project-osrm.org/) | Driving distance/routes | `delivery-quote.ts`, `CorridorMap` |
| [Leaflet](https://leafletjs.com/) | Corridor map | `CorridorMap.tsx` |

## Reference-only (not copied — stack differs)

These are **RN/Expo/Ember** codebases. We study UX only; AgroLink stays web PWA:

| Repo | Why not copied | What we took instead |
|------|----------------|----------------------|
| toptop, TikVibe | Same ideas, different routing | TanStack Router + Supabase |
| DeliveryApp, uber-app-clone | React Native | Web `/app/transport` + Leaflet |
| expo-delivery-app | NestJS + Socket.io monorepo | TanStack Start API routes + Supabase |
| Deliveroo clone, Foodies | RN + Redux | TanStack Query + shadcn cart UI |
| fleetbase/fleetbase | Full logistics OS | OSRM batch routing heuristic only |

## npm dependencies from OSS ecosystem

```json
"react-vertical-feed": "^0.1.21",
"react-riyils": "^2.58.0",
"leaflet": "^1.9.4",
"react-leaflet": "^5.0.0"
```

## Payments (Ghana — not OSS)

| Provider | AgroLink usage |
|----------|----------------|
| Paystack | MoMo checkout, subaccount escrow, Transfers payout |
| Hubtel | Ghana Card verify, SMS OTP (B2B orders) |

## Next borrow (optional)

1. TikVibe — tune `ai_demand_score` weights in `feed_rank`
2. react-riyils `RiyilsExplore` — farmer profile grid on `/farmers/$slug`
3. Yango-style surge heatmap on transport map
