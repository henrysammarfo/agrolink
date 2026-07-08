import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/server/api-auth";
import {
  geocodeAddress,
  reverseGeocode,
  placeAutocomplete,
  placeDetails,
  fetchGoogleDirections,
  getGoogleMapsApiKey,
} from "@/server/google-maps";

export const Route = createFileRoute("/api/maps")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await requireAuth(request);
          if (auth instanceof Response) return auth;

          if (!getGoogleMapsApiKey()) {
            return Response.json({ error: "Google Maps API key not configured" }, { status: 503 });
          }

          const body = (await request.json()) as {
            action: "geocode" | "reverse" | "autocomplete" | "place" | "directions";
            address?: string;
            lat?: number;
            lng?: number;
            input?: string;
            placeId?: string;
            origin?: { lat: number; lng: number };
            destination?: { lat: number; lng: number };
            waypoints?: { lat: number; lng: number }[];
          };

          switch (body.action) {
            case "geocode": {
              if (!body.address?.trim()) {
                return Response.json({ error: "address required" }, { status: 400 });
              }
              const result = await geocodeAddress(body.address);
              if (!result) return Response.json({ error: "Address not found" }, { status: 404 });
              return Response.json(result);
            }
            case "reverse": {
              if (body.lat == null || body.lng == null) {
                return Response.json({ error: "lat/lng required" }, { status: 400 });
              }
              const result = await reverseGeocode(body.lat, body.lng);
              if (!result) return Response.json({ error: "Location not found" }, { status: 404 });
              return Response.json(result);
            }
            case "autocomplete": {
              const suggestions = await placeAutocomplete(body.input ?? "");
              return Response.json({ suggestions });
            }
            case "place": {
              if (!body.placeId) {
                return Response.json({ error: "placeId required" }, { status: 400 });
              }
              const result = await placeDetails(body.placeId);
              if (!result) return Response.json({ error: "Place not found" }, { status: 404 });
              return Response.json(result);
            }
            case "directions": {
              if (!body.origin || !body.destination) {
                return Response.json({ error: "origin and destination required" }, { status: 400 });
              }
              const route = await fetchGoogleDirections(
                body.origin,
                body.destination,
                body.waypoints,
              );
              if (!route) return Response.json({ error: "No route found" }, { status: 404 });
              return Response.json(route);
            }
            default:
              return Response.json({ error: "Unknown action" }, { status: 400 });
          }
        } catch (error) {
          console.error("[Maps API]", error);
          return Response.json(
            { error: error instanceof Error ? error.message : "Maps request failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
