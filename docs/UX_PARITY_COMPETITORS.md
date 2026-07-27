# UX Parity — TikTok / Bolt / Uber Eats / DoorDash

Last updated: 2026-07-27  
Sources: Tavily research + live AgroLink mobile screenshots (360×640 Tecno/iTel class, 390×844 iPhone class) + Mapbox delivery-logistics skill.

## Competitor patterns we match

| Pattern | Bolt / Uber Eats / DoorDash | TikTok | AgroLink now |
|---------|----------------------------|--------|--------------|
| Full-bleed media first | Menu photos dominate | Full-screen video | Yes — feed card |
| Sticky primary CTA | Add / Checkout always visible | — | Yes — Add to cart bar |
| Right-rail actions | Rare | Like / comment / share | Like, comment, save, buy, share |
| Live map tracking | Must-have | — | Mapbox + phased route |
| Driver card after accept | Name, photo, vehicle, plate | — | `DriverProfileCard` |
| Nearby couriers on map | Soft dots / cars | — | Discreet pins (privacy) |
| MoMo / local pay | Region-specific | — | Paystack MoMo |
| Minimal steps to order | 2–4 taps | Swipe | Cart → Delivery → Driver → Pay |

## Gaps found (this session)

| Gap | Evidence | Fix priority |
|-----|----------|--------------|
| Relative time shows `420h ago` | Live `/market` screenshot | P0 — humanize dates |
| Auth feed blank spinner (no skeleton) | `/app/buyer/feed` while loading | P0 — dark FeedSkeleton already exists; ensure auth path uses it |
| Production Mapbox not on Vercel yet | Local token only | P0 — add env on Vercel (ask before deploy) |
| Right rail crowded for new users | 6 actions vs TikTok ~4 | P1 — keep Like/Comment/Share; demote Save; Buy stays |
| Landing hero CTAs stack OK on 360px | Budget phone shot | OK |
| Mobile hamburger present | 360px landing | OK |

## Device matrix tested (browser CDP)

| Device class | CSS size | Result |
|--------------|----------|--------|
| iPhone 14/15 class | 390×844 | Landing + feed OK |
| Budget Android (iTel / Tecno / Nova class) | 360×640 | Landing + feed OK; CTA readable |
| Samsung flagship class | ~412×915 | Same layout tokens as 390 (fluid) |

## Product principle (locked)

**TikTok users are our buyers.** Ordering must feel like swipe → tap Add to cart → MoMo — not a dashboard. Driver / admin can stay denser.

## Recommendations (best for finals)

1. Keep feed as the hero demo path (already strongest visual).
2. Humanize timestamps; hide jargon (“platform fee”) behind “Service fee”. *(timestamp fix shipped locally — deploy when you say)*
3. Push Mapbox token to Vercel so live pitch maps aren’t Leaflet fallback.
4. One-tap demo accounts on Sign in screen for judges.
5. Post-win: separate consumer PWA vs driver PWA (Uber model) — already roadmap.
6. **TikTok citizens rule:** swipe → Add to cart → MoMo → track map. No dashboard language on buyer path.
7. Track screen: show **clock ETA** (“by 5:40pm”) + 4-step strip (Matched → Pickup → On the way → Delivered) like DoorDash.
8. Budget phones (360×640): hide Save on rail (done locally); keep Buy + big bottom CTA.
9. WhatsApp notify copy should sound like TikTok captions, not logistics docs.
10. Optional: “Order again” on past orders (Uber Eats retention).

## Desktop TikTok parity (2026-07-27)

- Public `/market` and in-app feed use **left rail + centered 9:16 stage** on `lg+` (black stage, phone column).
- Guests can **watch** freely; like / save / comment / cart / follow open **Log in to AgroLink** modal (TikTok gate).
- Mobile stays full-bleed; light theme pages (landing, auth, dashboards) unchanged.


- Skills: `.agents/skills/mapbox-*` (19 packs)
- Cursor MCP: `.cursor/mcp.json` → mapbox-mcp, mapbox-devkit, mapbox-docs
- **You:** restart Cursor → authenticate Mapbox MCP OAuth when prompted
