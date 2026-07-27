# Mapbox Fact-Check — AgroLink

Last verified: 2026-07-27  
Sources: [docs.mapbox.com](https://docs.mapbox.com/), Directions / Matrix / Map Matching API refs, GL JS guides, Mapbox Help “How Directions services work”.

## Verified facts (do not invent beyond these)

| Claim | Status | Source |
|-------|--------|--------|
| Mapbox GL JS current major line is **v3.x** (docs show v3.27.x) | Verified | GL JS Guides |
| AgroLink deps use `mapbox-gl` ^3.27 + `react-map-gl` ^8 | Verified | `package.json` after install |
| Directions profiles: `driving-traffic`, `driving`, `walking`, `cycling` | Verified | Directions API |
| `driving-traffic` uses live + historic traffic; live ≈ last 15 min where available | Verified | Help → Directions deep dive |
| Directions accepts up to **25** coordinates per request | Verified | Directions API |
| Matrix `driving-traffic` max **10** coords; other profiles 25; rate limits 30–60 rpm | Verified | Matrix API |
| Map Matching snaps GPS traces to roads; up to 100 coords for coordinate form | Verified | Map Matching API |
| GeoJSON route geometry from Directions is **lng,lat** | Verified | Directions tutorials |
| Web apps: GL JS + Directions APIs; turn-by-turn Navigation SDK is **mobile** (iOS/Android) | Verified | Navigation products overview |
| Mapbox Standard style is default when no style passed; Streets/Dark style URLs still valid | Verified | GL JS Guides |
| Attribution required on maps (GL JS adds control) | Verified | Attribution guide |
| React path: official “Use Mapbox GL JS with React” + `react-map-gl` | Verified | Mapbox tutorials / react-map-gl |

## AgroLink implementation alignment

| Feature | Implemented? | Notes |
|---------|--------------|-------|
| GL JS map in CorridorMap | Yes | `MapboxCorridorMap` → Leaflet fallback |
| Directions `driving-traffic` | Yes | `fetchMapboxDirections` |
| Matrix for availability ETAs | Yes | `fetchDistanceMatrix` |
| Map Matching for driver GPS | Yes | `snapToRoads` |
| Geocoding autocomplete | Yes | `/api/maps` autocomplete |
| Native Navigation SDK turn-by-turn UI | No | Deferred to post-win driver app |
| Custom Mapbox Studio style | No | Use dark-v11 / streets-v12 until Studio brand style |
| Search Box JS / Address Autofill SDK | No | Geocoding API sufficient for demo |
| Optimization API (multi-stop beta) | Partial | We use nearest-neighbor + Directions waypoints |
| Isochrone / EV APIs | No | Out of scope |

## Privacy fact

Showing **exact** live driver GPS to buyers **before** job accept is a product risk. AgroLink uses **discreet** nearby markers (`driver-privacy.ts`) until assignment — then full live track.

## Hallucination guards

- Do **not** claim Mapbox Navigation SDK is running in the web PWA
- Do **not** invent Ghana-specific traffic coverage % without Mapbox Traffic Data page citation
- Do **not** store Mapbox tokens in git; rotate after finals
- Re-run Tavily / docs fetch when upgrading `mapbox-gl` major versions

## Tavily session notes (2026-07-27)

- Prefer official Mapbox docs over Stack Overflow / blogs when conflicting.
- `react-map-gl` Source/Layer: update GeoJSON via new `data` prop or remount key — PureComponent won’t deep-diff mutated objects.
- Large GeoJSON: use vector tiles / tolerance / split static vs dynamic sources (Mapbox Help performance guides).
- Live realtime pattern: `getSource(...).setData(geojson)` (GL JS example “Add live realtime data”).
- Navigation SDK turn-by-turn remains **mobile-only**; web uses Directions + custom HUD (our `DriverNavHud`).
