# APK / Android Build — **DEFERRED**

> **Current launch path is PWA only.** See `docs/PWA.md` for production install.

AgroLink ships as a **PWA-first** TanStack Start web app. Native APK via Capacitor is a future phase, not required for go-live.

## Prerequisites

- Node.js 20+
- Android Studio (SDK 34+, JDK 17)
- `npm run build` succeeds locally
- Supabase + Paystack + Hubtel env vars set for production

## Quick path (PWA install)

1. Deploy the built site over **HTTPS**
2. Open `/app/buyer/feed` on Android Chrome
3. **Add to Home screen** — uses `public/manifest.webmanifest`

## Native APK (Capacitor)

```bash
# 1. Production build
npm run build

# 2. Sync web assets into Android project
npx cap sync android

# 3. Open Android Studio
npx cap open android

# 4. In Android Studio: Build → Generate Signed Bundle / APK
```

First-time setup:

```bash
npx cap add android   # only once, after first build
```

## Configuration

| File | Purpose |
|------|---------|
| `capacitor.config.ts` | App ID `com.agrolink.app`, webDir `.output/public` |
| `public/manifest.webmanifest` | PWA icons, theme, standalone display |
| `public/icons/` | 192×192 and 512×512 maskable icons |

## Production checklist

- [ ] Replace placeholder icons in `public/icons/` — run `npm run icons:generate`; PNGs ship from BrandMark gradient
- [ ] Seed Supabase listings: `npm run seed:demo` (or use `VITE_DEMO_MODE=true` client fallback)
- [ ] Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` in build env
- [ ] Set server secrets: Paystack, Hubtel, FCM, OpenAI
- [ ] Apply Supabase migration `20260705030000_escrow_countdown_batch_otp.sql`
- [ ] Test MoMo on device (not emulator) with MTN test line
- [ ] Test driver 30s accept countdown + push notifications
- [ ] Enable Play Store **App Signing**

## UX targets (competitor parity)

| Pattern | Reference | AgroLink route |
|---------|-----------|----------------|
| TikTok vertical feed | react-vertical-feed, toptop | `/app/buyer/feed` |
| Bolt job accept timer | DeliveryApp, Bolt clone | `/app/transport`, `/app/transport/jobs` |
| DoorDash escrow | Paystack subaccounts | checkout + delivery complete |
| Multi-stop co-op | fleetbase, OSRM trip | cart batch quote |

## Notes

- The web server API routes (`/api/*`) must be reachable from the app — point Capacitor `server.url` to your deployed origin for dev, or bundle API via same host.
- For offline-first driver GPS, consider `@capacitor/geolocation` in a follow-up; current stack uses browser geolocation + Supabase Realtime.
