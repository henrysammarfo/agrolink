# Build Guide Delta

Mapping from uploaded `AGROLINK_BUILD_GUIDE.md` to actual implementation.

## Architecture

| Build guide | Actual |
|-------------|--------|
| `backend/` Express + Prisma | **Not built** — use Supabase + `src/server/` |
| `mobile/` React Native Expo | **Deferred** — responsive PWA (`src/routes/`) |
| `web/` Next.js admin | **Merged** — TanStack Start handles all routes |

## Database

| Build guide (Prisma) | Actual (Supabase) |
|---------------------|-------------------|
| `User` + `Role` enum | `auth.users` + `profiles` + `user_roles` |
| `FarmerProfile` | `profiles` + `user_roles(farmer)` + seller fields on profile |
| `BuyerProfile` | `profiles` + `user_roles(buyer)` |
| `TransportProfile` | `driver_profiles` table |
| `ProduceListing` | `listings` table |
| `Order` | `orders` + `order_items` |
| `Delivery` | `deliveries` |
| `Message` | `messages` |
| `Rating` | `listing_engagement` + profile ratings |
| `AIAnalysis` | `ai_analysis` |
| `MarketPrice` | `market_prices` |

## API routes

| Build guide route | Actual |
|-------------------|--------|
| `GET /produce/feed` | Supabase query on `feed_rank` view + `src/lib/api/listings.ts` |
| `POST /produce/listing` | Supabase insert + Storage upload + `src/server/moderate-listing.ts` |
| `GET /produce/price-advice/:crop` | `src/server/price-advice.ts` |
| `POST /payments/*` | `src/server/paystack.ts` + webhook |
| `Socket.io realtime` | Supabase Realtime on `deliveries`, `driver_profiles` |

## Mobile screens → web routes

| Build guide screen | Actual route |
|--------------------|--------------|
| `DiscoveryFeed.tsx` | `/app/buyer/feed`, `/market` → `FeedPlayer` |
| `ListProduce.tsx` | `/app/create` |
| `DriverHome.tsx` | `/app/transport` |
| `Navigation.tsx` | `/app/transport` + OSRM |
| `TrackDelivery.tsx` | `/app/buyer/orders` + `LiveTrackCard` |
| `Cart.tsx` / `Checkout.tsx` | `/app/buyer/cart` |
| `Profile.tsx` | `/app/profile`, `/app/settings` |

## Env vars

| Build guide | Actual |
|-------------|--------|
| `ANTHROPIC_API_KEY` | `OPENAI_API_KEY` (primary) |
| `DATABASE_URL` | Supabase managed (no direct Prisma) |
| `HUBTEL_*` | Same names, secondary payment |
| `CLOUDINARY_*` | Supabase Storage buckets |
| `GOOGLE_MAPS_API_KEY` | Optional; Leaflet+OSRM default |

## Intentional deviations (better for production)

1. Unified signup (TikTok pattern) instead of role-at-signup
2. OpenAI moderation instead of Claude (user has OpenAI key)
3. Paystack primary over Hubtel (better test mode)
4. Supabase Realtime instead of Socket.io
5. Server functions instead of separate Express server
