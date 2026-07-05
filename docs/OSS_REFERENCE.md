# Open-Source Reference Library — AgroLink

Curated repos mapped to AgroLink features. Use for UX patterns, not copy-paste — we extend TanStack Start + Supabase.

## TikTok / Reels (vertical feed, profiles, FYP)

| Repo | Stars | Stack | Borrow for AgroLink |
|------|-------|-------|---------------------|
| [mrthinh307/toptop](https://github.com/mrthinh307/toptop) | — | React 19 + Supabase | Unified auth, follow, profile tabs, video feed |
| [yns19971020-cyber/tiktok](https://github.com/yns19971020-cyber/tiktok) (TikVibe) | — | Next.js 16 + Prisma | FYP ranking formula, double-tap like, comment threads |
| [reinaldosimoes/react-vertical-feed](https://www.npmjs.com/package/react-vertical-feed) | npm | React component | Intersection-observer autoplay for `FeedPlayer` |
| [illegal-instruction-co/react-riyils](https://github.com/illegal-instruction-co/react-riyils) | — | React | Gesture physics, explore grid → farmer profile grid |
| [neomavkda3/react-tiktok-style-video-scroller](https://github.com/neomavkda3/react-tiktok-style-video-scroller) | — | React + virtual scroll | Infinite feed pagination |

**AgroLink now has:** `react-riyils` Swiper gestures + `react-vertical-feed` embed mode, POD capture, Capacitor geolocation, demo feed seed.

**Next borrow:** TikVibe trending score tuning; react-riyils gesture physics for feed; fleetbase POD photo on deliver.

---

## Uber / Bolt / Yango (driver app)

| Repo | Stack | Borrow for AgroLink |
|------|-------|---------------------|
| [chimzyfire-ship-it/DeliveryApp](https://github.com/chimzyfire-ship-it/DeliveryApp) | React Native | Driver doc upload flow, job accept sheet |
| [fleetbase/navigator-app](https://github.com/fleetbase/navigator-app) | Ember + Fleetbase | Navigator UX, POD capture, route polyline |
| [bolt-delivery/bolt-delivery-app](https://github.com/bolt-delivery/bolt-delivery-app) | Archived RN | Online toggle, earnings screen layout |
| [UberGuiding/uber-app-clone](https://github.com/UberGuiding/uber-app-clone) | React Native + Firebase | Map + bottom sheet job card pattern |

**AgroLink now has:** `/app/transport` map with 30s accept countdown, job reassign API, co-op multi-stop pickups, Paystack escrow + release on complete.

**Next borrow:** fleetbase POD photo capture; Yango-style surge heatmap UI.

---

## DoorDash / Deliveroo / Glovo (buyer + dispatch)

| Repo | Stack | Borrow for AgroLink |
|------|-------|---------------------|
| [mykhayloyuminov/expo-delivery-app](https://github.com/mykhayloyuminov/expo-delivery-app) | Expo monorepo + NestJS + Socket.io | Real-time order lifecycle, push on new order |
| [SashenJayathilaka/Deliveroo-Clone](https://github.com/SashenJayathilaka/Deliveroo-Clone) | RN + Sanity | Checkout summary, restaurant/listing cards |
| [adrianhajdin/food_ordering](https://github.com/adrianhajdin/food_ordering) | RN + Appwrite | Cart → pay → track flow |
| [chayan-1906/Foodies-React-Native](https://github.com/chayan-1906/Foodies-React-Native) | RN + Redux | Multicart, animated checkout |

**AgroLink now has:** Cart OTP for GHS 500+, Paystack split/escrow, batch farm routing in delivery quote.

**Next borrow:** expo-delivery-app Socket.io for sub-second order updates (Supabase Realtime covers most cases today).

---

## Maps & routing

| Resource | Use |
|----------|-----|
| [OSRM](http://project-osrm.org/) | Free driving routes (already integrated) |
| [Leaflet](https://leafletjs.com/) | Corridor map pins (already integrated) |
| [fleetbase/fleetbase](https://github.com/fleetbase/fleetbase) | Open logistics OS — reference for multi-stop |

---

## Payments (Ghana)

| Provider | Docs | AgroLink usage |
|----------|------|----------------|
| Paystack | [Transfers](https://paystack.com/docs/transfers/) | `paystack-transfers.ts` — farmer/driver auto-payout |
| Hubtel | [Identity Verify](https://developers.hubtel.com/) | `hubtel.ts` — Ghana Card in driver onboarding |

---

## Additional recommendations

1. **Socket.io or Supabase Realtime channels** — job offer with 30s accept timer (Bolt countdown)
2. **react-vertical-feed** — replace custom scroll in FeedPlayer for TikTok snap feel
3. **OR-Tools** — batch co-op pickups (multiple farms → one buyer)
4. **Sentry + PostHog** — funnel: feed view → cart → pay → deliver
5. **PWA + FCM** — native install prompt for drivers; `FCM_SERVER_KEY` in `.env`
6. **Hubtel SMS** — OTP for high-value orders
7. **Paystack Subaccounts** — escrow per order until delivered (DoorDash model)
