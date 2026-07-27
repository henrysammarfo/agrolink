/**
 * @deprecated Import from `@/server/mapbox` instead.
 * Re-exports Mapbox façade so existing imports keep working during migration.
 */
export {
  geocodeAddress,
  reverseGeocode,
  placeAutocomplete,
  placeDetails,
  fetchMapboxDirections,
  fetchGoogleDirections,
  fetchDistanceMatrix,
  snapToRoads,
  fetchDrivingDistanceKm,
  fetchDrivingRouteWithFallback,
  getMapboxAccessToken,
  getGoogleMapsApiKey,
  type GeoResult,
  type PlaceSuggestion,
  type DirectionStep,
  type DrivingRoute,
  type MatrixElement,
} from "@/server/mapbox";
