This is a large overhaul. I'm breaking it into phases so we can verify each one. Confirm or edit before I start.

## Phase 1 — Foundation (must-do first)

**Theme flip: light = default, dark = opt-in**

- Switch `src/styles.css` so `:root` is the warm-paper light palette (cream/off-white background, near-black text, harvest green + amber accents kept). Move the current cinematic dark palette into `.dark`.
- Add a `ThemeProvider` (localStorage + `class="dark"` on `<html>`). Toggle lives only in `/app/settings` under Profile → Appearance. No system-level dark on first load.

**Real role-based auth (no in-app role switcher)**

- Enable Lovable Cloud. Add `auth.users` + `profiles` (display name, avatar, bio, phone, region) + `user_roles` (`app_role` enum: `buyer | farmer | transport`) + `has_role()` SECURITY DEFINER function. Email/password + Google.
- Signup flow: pick account type (Buyer/Market Woman, Farmer/Seller, Transport Partner). A user can hold both `buyer` and `farmer` roles (market women sell + buy); `transport` is exclusive — drivers get a different app shell.
- Remove the buyer/farmer/transport switcher from `AppShell`. Route guards (`_authenticated` + role check) decide what's reachable. A user with both roles sees a "Switch to Farmer Studio / Buyer" link in the profile menu — same account, different surface, like TikTok creator vs viewer.
- `/app/transport/*` is gated to `transport` role only.

## Phase 2 — TikTok-style consumer experience (Buyer + public Market)

`**/market` and `/app/buyer/feed` rebuilt as a real vertical feed**

- Full-bleed 9:16 cards, snap-scroll (`scroll-snap-y mandatory`), one card per viewport, swipe / wheel / arrow-key paging, autoplaying muted video where available, image fallback.
- Right rail action stack (TikTok-style): Like, Comment, Share, Save/Bookmark, Add to Cart. Counters animate.
- Bottom-left meta: farmer avatar + handle (links to profile), produce name, price/kg, location, "posted Xh ago", quantity available.
- Remove the "Up next" grid that you didn't like. Replace with: discreet progress dots on the right edge and a hidden "Browse all" drawer triggered by a small grid icon — keeps the feed pure.
- Comments open in a bottom sheet (Drawer). Share opens native share sheet. Save writes to bookmarks table.

**Farmer profile = TikTok profile**

- `/farmers/$slug` rebuilt: cover image, avatar, verified badge, name, bio, region, follower/following/likes counts, Follow + Message buttons. Tabs: Posts (grid of their listings as video/photo thumbs), Liked, Reposts. Tapping a thumb opens the feed at that item.

**Mobile bottom nav for buyer/farmer shell (TikTok pattern)**

- 5 tabs: Home (feed) · Search/Discover · **Create (+)** center · Inbox · Profile.
- Create button opens a sheet: Farmer role → "New listing" (photo/video upload, caption, price, qty, hashtags, location). Buyer-only → "Request produce" post. Content moderation stub flag for now (banner: "Posts violating community rules will be removed").

**Inbox**

- Notifications (likes, comments, follows, order updates) + DMs. View-count opt-in toggle in settings.

## Phase 3 — Farmer Studio (creator-style dashboard)

- `/app/farmer` redesigned like TikTok Studio: revenue this week, views, engagement, top listings, orders waiting.
- `/app/farmer/listings` — grid of post-cards with edit/delete/boost; "Create" CTA opens the same composer as the + button.
- `/app/farmer/orders` — kanban-ish: New → Accepted → Packed → In transit → Delivered. Accept/decline with one tap.
- `/app/farmer/payouts` — TikTok-creator-payouts feel: balance card, "Withdraw to MoMo" button, transaction list, P&L mini chart, tax-ready export.

## Phase 4 — Transport app (Bolt/Uber-style, separate shell)

- Distinct shell (`/app/transport/*`) with its own bottom nav: Map · Jobs · Earnings · Profile.
- **Map** (Mapbox GL or Leaflet+OSM — free) with live job pins, current job route, ETA, pickup→dropoff polyline, customer pin.
- **Active job flow**: Accept → Navigate to farm → Picked up → En route → Delivered, each step updates the buyer + farmer in real time (Supabase Realtime).
- **Buyer side**: order tracking page shows driver on the same map, ETA, driver name/photo/vehicle/plate, call/message buttons, dynamic price (surcharge if delay).
- **Earnings**: per-trip breakdown, weekly payout to MoMo.

## Phase 5 — Marketing site polish

- **Hero**: remove the heavy black overlay on the video — drop overlay opacity from ~70% to ~25% and use a subtle bottom gradient only so the footage stays bright. Same fix on About hero.
- **"How it works"** section on `/` (the 3-persona block): redesign as a clean 3-step horizontal timeline with proper Lucide icons (Sprout, ShoppingBasket, Truck), large numerals, real screenshots, no sloppy emoji-feeling glyphs.
- `**/how-it-works**` page: rebuild flow diagrams, swap the sloppy AI/pricing icons for proper Lucide (`Sparkles`, `Brain`, `BadgePercent`, `Workflow`).
- `**/about**`: replace the dotted ASCII "corridor map" with a real Leaflet map of the Greater Accra corridor (Kasoa → Accra → Tema → Ada) with farm pins.
- `**/pricing**`: reframe — TikTok-style "free for everyone, platform takes a small % on completed orders + delivery fee". No subscription tiers. Show transparent fee breakdown vs. competitors (current Accra middleman markup) to prove "cheaper than the market".

## Phase 6 — Payments (demo + production-ready)

- Integrate **Paystack** (works for Ghana, MoMo + cards). Add `DEMO_MODE` flag — when on, use Paystack test keys and label clearly; when off, production keys.
- Buyer checkout → Paystack inline → order row → farmer notified → transport job created.
- Farmer + driver payouts via Paystack Transfers to MoMo wallets.

## Phase 7 — Onboarding & verification

- Per-role onboarding wizard (3–4 screens, big buttons, low literacy: icons + short Twi/English labels option later).
- Phone OTP verification (Supabase phone auth) — required for farmers + drivers before they can list/accept.
- Driver: vehicle type, plate, photo of license (stored in Cloud Storage), background check toggle.

---

## What I'll build first (this turn, if you approve)

Phase 1 in full (theme flip, Cloud + auth + roles, remove switcher, role-gated routes) plus the hero brightness fix and the new TikTok feed for `/market` and `/app/buyer/feed`. Phases 2–7 land in follow-up turns so each is reviewable.

## Open questions

- **Map provider**: Leaflet + OpenStreetMap (free, no key) or Mapbox (prettier, needs token)? i think theres a opensource of bolt or uber which u can get the designs and use for us where it fits and needed
- **Payments**: confirm Paystack (recommended for Ghana). I'll add it with demo-mode keys you can paste later. yhh so hubtel and paystack - but they have to have test mode, i think paystack has but dont know of hubtel 
- **Twi/English toggle**: in scope now or later? english defualt , new languages later thats if we expand to other regions
- **Live streaming** (you mentioned maybe): defer to a later phase — fine?yhh last phase ,  
  
Overall , go on wen , search , and look for screenss of tiktok and screenshots of all pages so u know wat not to miss and earn somethin new , same for boltfood and uber and doordash , and competitors 