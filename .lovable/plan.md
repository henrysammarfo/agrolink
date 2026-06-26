# AgroLink — Cinematic Marketplace Web Build

Build a polished marketing + product web app for **AgroLink** (AI-powered produce marketplace, Greater Accra) using the **Atelier template aesthetic**: fullscreen video hero, Instrument Serif display + Inter body, dark cinematic palette with a fresh agri accent. All pages, routes, subpages, and dashboards share this visual language. Premium Lucide icons throughout. Brand-ready logo for future merch.

> Scope: frontend only (no backend wiring this turn). Lovable Cloud / data can come later. Mock data drives dashboards.

## Brand

- **Name:** AgroLink
- **Wordmark:** "Agrolink" in Instrument Serif, lowercase, tight tracking, with a small leaf glyph dot over the "i" — works monochrome on hoodies/merch.
- **Logo mark:** Minimal circular monogram "a." with leaf cutout, generated as SVG so it scales to print/embroidery. Variants: white-on-dark, black-on-white, single-color.
- **Palette (tokens in `src/styles.css`):**
  - `--background` near-black `oklch(0.14 0.01 145)`
  - `--foreground` warm white
  - `--primary` deep harvest green `oklch(0.62 0.14 145)`
  - `--accent` sun amber `oklch(0.78 0.16 75)`
  - `--muted` slate
- **Type:** Instrument Serif (display + italic accents), Inter 300–600 (UI). Loaded via `<link>` in `__root.tsx` head.
- **Motion:** 500–700ms cubic-bezier(0.76,0,0.24,1). Staggered fade-up. Hover arrow translate.

## Routes (TanStack file-based)

Marketing:
- `/` — Atelier-style hero (looping muted video bg, h1 "FRESH PRODUCE *for* BOLD KITCHENS / FROM FARM *to* TABLE"), CTAs "Browse Market" + "Watch Reel". Below the fold: live-feed teaser, stats strip, featured farmers, how it works, testimonials, CTA, footer.
- `/market` — TikTok-style vertical swipe feed of produce listings (video/photo cards, price, farmer, location, add-to-cart).
- `/farmers` — directory grid + featured farmer stories.
- `/farmers/$slug` — farmer profile (bio, video, listings, ratings, location map placeholder).
- `/how-it-works` — three-persona explainer (Farmer / Buyer / Transport) with serif section heads.
- `/pricing` — buyer tiers (Household / Restaurant / Wholesale) + transport rate card.
- `/about` — mission, Greater Accra corridor map, team.
- `/contact` — form + WhatsApp / Hubtel contact tiles.
- `/auth` — sign-in / sign-up split screen with role picker (Farmer / Buyer / Transport).

App (shared dashboard shell with collapsible sidebar, top bar, command palette trigger):
- `/app` — role-aware redirect.
- `/app/buyer` — overview: active orders, recommended produce, spend chart.
- `/app/buyer/feed` — full swipe feed in-app.
- `/app/buyer/orders` — orders list + detail drawer.
- `/app/buyer/cart` — cart + Hubtel checkout mock.
- `/app/farmer` — overview: revenue, active listings, pending pickups.
- `/app/farmer/listings` — manage listings (table + create modal with video/photo upload UI).
- `/app/farmer/orders` — incoming orders + status updates.
- `/app/farmer/payouts` — mobile money history.
- `/app/transport` — job board map view + active job.
- `/app/transport/jobs` — job history + earnings.
- `/app/settings` — profile, notifications (WhatsApp toggle), payment.

Utility: `404` (already exists), shared `errorComponent`.

## Shared components

- `BrandLogo` (svg, sizes), `BrandMark`
- `SiteHeader` (transparent over hero, solid on scroll) + animated hamburger mobile menu overlay (Instrument Serif stacked links, staggered fade)
- `SiteFooter`
- `AppShell` with `Sidebar` (shadcn sidebar, collapsible icon mode), `Topbar`
- `ProduceCard`, `SwipeFeed`, `OrderRow`, `StatCard`, `RoleBadge`, `EmptyState`
- Icons: Lucide premium set — `Leaf`, `Sprout`, `Tractor`, `Truck`, `ShoppingBasket`, `Wallet`, `MapPin`, `PlayCircle`, `ArrowRight`, `ArrowUpRight`, `Sparkles`, `BadgeCheck`, `MessageCircle`.

## Design tokens & global CSS

- Update `src/styles.css`: add Inter/Instrument Serif `@theme` font tokens, agri color tokens (light + dark), gradient + shadow tokens (`--gradient-harvest`, `--shadow-cinema`). Keep shadcn token mapping intact.
- Add `<link>` tags for Google Fonts in `src/routes/__root.tsx` head (NOT @import in CSS).
- Update root meta to "AgroLink — Fresh produce, delivered across Accra".

## Technical notes

```text
src/
  routes/
    __root.tsx (fonts, header/footer wrapper opt-in per route)
    index.tsx
    market.tsx
    farmers.tsx / farmers.$slug.tsx
    how-it-works.tsx / pricing.tsx / about.tsx / contact.tsx / auth.tsx
    app.tsx (layout w/ AppShell + Outlet)
    app.index.tsx (role redirect)
    app.buyer.tsx + app.buyer.feed/orders/cart.tsx
    app.farmer.tsx + app.farmer.listings/orders/payouts.tsx
    app.transport.tsx + app.transport.jobs.tsx
    app.settings.tsx
  components/brand/, components/site/, components/app/, components/produce/
  lib/mock-data.ts
  assets/ (generated hero video poster + farmer/produce imagery via imagegen)
```

- Hero video: use the provided CloudFront mp4 URL as `<video autoplay muted loop playsinline>` background.
- Generate ~6 images via imagegen (logo mark, farmer portraits, produce stills, corridor map illustration). Premium tier for the logo.
- Each route sets distinct `head()` meta (title, description, og:title, og:description); leaf routes add `og:image`.
- All colors via semantic tokens — no `text-white`/`bg-black` hardcodes in components (hero video overlay is the documented exception using `/` opacity tokens).
- Mock data only; no Lovable Cloud this turn.

## Out of scope (call out to user after build)

- Real auth, database, payments (Hubtel), WhatsApp (WATI), Claude AI matching, Google Maps live tracking — all stubbed. Enable Lovable Cloud + connectors in a follow-up.
