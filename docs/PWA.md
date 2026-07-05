# PWA — Production install (primary mobile path)

AgroLink is **PWA-first**. No native APK required for launch — users install from Chrome/Safari over HTTPS.

## What is implemented

| Feature | Location |
|---------|----------|
| Web manifest | `public/manifest.webmanifest` |
| Service worker | `public/sw.js` — static cache + offline fallback |
| Install prompt | `PwaProvider` — `beforeinstallprompt` banner |
| App icons | `public/icons/icon-192.png`, `icon-512.png` |
| Standalone feed | `/app/buyer/feed` as `start_url` |
| Theme / safe area | `#0f1a14`, immersive app shell |

## Production checklist

1. Deploy over **HTTPS** (required for SW + install)
2. Set production env: Supabase, Paystack, Hubtel, FCM (optional push)
3. Apply all Supabase migrations
4. `npm run build` — verify `sw.js` and manifest copied to `.output/public`
5. Test install on Android Chrome → Add to Home screen
6. Test iOS Safari → Share → Add to Home Screen
7. Optional: `npm run seed:demo` or real farmer listings for feed

## Screenshots

```bash
VITE_DEMO_MODE=true npm run dev   # terminal 1
node scripts/capture-screenshots.mjs   # terminal 2
```

Output: `/opt/cursor/artifacts/screenshots/`

## APK / Capacitor (deferred)

Native APK is **not** the current launch path. Capacitor config remains for a future phase — see `capacitor.config.ts` when needed.
