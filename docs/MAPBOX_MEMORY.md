# Mapbox Memory — AgroLink (source of truth)

Last updated: 2026-07-27  
Fact-check companion: [`docs/MAPBOX_FACTCHECK.md`](./MAPBOX_FACTCHECK.md)

## Why Mapbox (locked decision)

AgroLink logistics maps use **Mapbox** as primary (same class as Uber/Bolt/DoorDash-style routing UX). Google Maps is legacy/optional only. Leaflet + Carto is emergency fallback when `VITE_MAPBOX_ACCESS_TOKEN` is missing.

## Stack we use (web PWA — not native Navigation SDK yet)

| Layer | Product | AgroLink usage |
|-------|---------|----------------|
| Client maps | **Mapbox GL JS v3** via `react-map-gl/mapbox` | `MapboxCorridorMap.tsx` |
| Styles | `mapbox://styles/mapbox/dark-v11` (logistics) / `streets-v12` (light) | Driver + buyer maps |
| Routing | **Directions API** `mapbox/driving-traffic` | Checkout quotes, live track, driver nav |
| ETAs | **Matrix API** | `/api/delivery/availability` driver ETAs |
| GPS snap | **Map Matching API** | Driver location publish (`snapToRoads`) |
| Search | **Geocoding API** v5 | Address autocomplete / reverse |
| Server façade | `src/server/mapbox.ts` | All `/api/maps` actions |
| Env | `MAPBOX_ACCESS_TOKEN` + `VITE_MAPBOX_ACCESS_TOKEN` | Server + GL JS public token |

**Not in this phase (post-win native apps):** Mapbox Navigation SDK iOS/Android, Search Box UI SDK, Mapbox Studio custom style (use Studio later for brand style URL).

## Coordinates convention (critical — do not break)

- **App / CorridorMap pins & routes:** `[lat, lng]`
- **Mapbox API & GL JS:** `[lng, lat]`
- Conversion lives in `MapboxCorridorMap` (`toLngLat`) and `mapbox.ts` (directions geometry flip)

## Logistics UX contract (Bolt/Uber parity)

1. **Buyer checkout (step 2–3):** Map shows farm + dropoff + **discreet nearby driver markers** (never exact GPS pre-accept). Route farm→buyer via Directions.
2. **Driver accept:** Buyer sees `DriverProfileCard` (avatar, name, plate, vehicle, rating).
3. **Buyer track:** Phased route — before pickup `driver→farm`; after `picked_up` `driver→buyer`. Live GPS via Realtime on `driver_profiles`.
4. **Driver map:** Live self marker + pickup/dropoff + **available job pins** when online; Directions to active leg; throttle re-route (~150m / status change).
5. **Payment gate:** MoMo **first**, then notify drivers (pay-then-match). Jobs list / accept require `payment_status === paid`.

## Performance rules (from Mapbox delivery patterns)

- Update driver GeoJSON / marker via position update — do **not** recreate map
- Directions refetch: status change or ≥~150m drift (not every GPS tick)
- Prefer `setData` / Marker move; throttle paint 3–5s where needed
- Matrix `driving-traffic`: max **10** coordinates; general profiles max 25

## Token hygiene

- Public `pk.` token for GL JS — **URL-restrict** in Mapbox account (localhost + Vercel)
- Same or secret token for server Directions/Matrix/Matching
- Keys in `.env.local` only — never commit
- Rotate after finals (user rule)
- Mapbox also offers MCP / Agent Skills / Docs MCP for AI — optional; AgroLink uses Tavily + official docs for fact-check

## Session log

| Date | Change |
|------|--------|
| 2026-07-27 | Google → Mapbox swap; Embla feed; DriverProfileCard; phased track; memory + factcheck docs |
| 2026-07-27 | Tavily fact-check pass; buyer map shows discreet nearby courier pins; driver map shows available job pins when online |
| 2026-07-27 | Tokens in `.env.local` (Mapbox pk + Tavily) — rotate after finals; URL-restrict Mapbox token |
| 2026-07-27 | UI revamp Phase 2: custom HTML farm/buyer/hub/job pins; pay-then-match doc fix; Seller Studio rail |
