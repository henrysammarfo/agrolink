import { createFileRoute } from "@tanstack/react-router";
import { optionalAuth } from "@/server/api-auth";
import { haversineKm, radiusForOfferRound, vehicleToFilterBucket } from "@/lib/vehicle-types";
import { computeDeliveryQuote } from "@/server/delivery-quote";
import { fetchDistanceMatrix, getMapboxAccessToken, type MatrixElement } from "@/server/mapbox";
import { discreetCoverageNearPickup, discreetDriverPinsNearPickup } from "@/lib/driver-privacy";

const BUYER_OPTIONS = [
  { type: "bicycle" as const, label: "Bicycle", icon: "🚲" },
  { type: "motorcycle" as const, label: "Motor", icon: "🏍️" },
  { type: "car" as const, label: "Car", icon: "🚗" },
];

const VEHICLE_ETA_FACTOR: Record<(typeof BUYER_OPTIONS)[number]["type"], number> = {
  bicycle: 1.35,
  motorcycle: 1,
  car: 1.15,
};

function mapVehicleForQuote(type: "bicycle" | "motorcycle" | "car") {
  if (type === "car") return "pickup" as const;
  if (type === "bicycle") return "motorcycle" as const;
  return "motorcycle" as const;
}

function matrixEtaMin(el: MatrixElement | undefined) {
  if (!el || el.status !== "OK") return null;
  return el.duration_in_traffic_min ?? el.duration_min;
}

export const Route = createFileRoute("/api/delivery/availability")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const pickupLat = Number(url.searchParams.get("pickupLat"));
        const pickupLng = Number(url.searchParams.get("pickupLng"));
        const deliveryLat = Number(url.searchParams.get("deliveryLat"));
        const deliveryLng = Number(url.searchParams.get("deliveryLng"));
        const weightKg = Number(url.searchParams.get("weightKg") ?? 10);

        if (!pickupLat || !pickupLng || !deliveryLat || !deliveryLng) {
          return Response.json({ error: "Missing coordinates" }, { status: 400 });
        }

        await optionalAuth(request);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const radiusKm = radiusForOfferRound(1);
        const pickup = { lat: pickupLat, lng: pickupLng };
        const delivery = { lat: deliveryLat, lng: deliveryLng };

        const { data: drivers } = await supabaseAdmin
          .from("driver_profiles")
          .select("id, vehicle_type, current_lat, current_lng, available")
          .eq("verification_status", "approved")
          .eq("available", true)
          .not("current_lat", "is", null)
          .not("current_lng", "is", null);

        const nearby = (drivers ?? []).filter((d) => {
          const dist = haversineKm(pickup, {
            lat: d.current_lat as number,
            lng: d.current_lng as number,
          });
          return dist <= radiusKm;
        });

        let routeEtaMin: number | null = null;
        const driverPickupEtaMin: Partial<Record<(typeof BUYER_OPTIONS)[number]["type"], number>> =
          {};

        if (getMapboxAccessToken()) {
          try {
            const routeMatrix = await fetchDistanceMatrix([pickup], [delivery], "driving");
            routeEtaMin = matrixEtaMin(routeMatrix[0]?.[0]);
          } catch (err) {
            console.warn("[availability] route matrix failed:", err);
          }

          const nearestByType = BUYER_OPTIONS.map((opt) => {
            const typed = nearby.filter(
              (d) => vehicleToFilterBucket(d.vehicle_type) === opt.type,
            );
            if (!typed.length) return null;
            let best = typed[0];
            let bestDist = haversineKm(pickup, {
              lat: best.current_lat as number,
              lng: best.current_lng as number,
            });
            for (const d of typed.slice(1)) {
              const dist = haversineKm(pickup, {
                lat: d.current_lat as number,
                lng: d.current_lng as number,
              });
              if (dist < bestDist) {
                best = d;
                bestDist = dist;
              }
            }
            return {
              type: opt.type,
              lat: best.current_lat as number,
              lng: best.current_lng as number,
            };
          }).filter(Boolean) as { type: (typeof BUYER_OPTIONS)[number]["type"]; lat: number; lng: number }[];

          if (nearestByType.length) {
            try {
              const driverMatrix = await fetchDistanceMatrix(
                nearestByType.map((d) => ({ lat: d.lat, lng: d.lng })),
                [pickup],
                "driving",
              );
              nearestByType.forEach((driver, i) => {
                const eta = matrixEtaMin(driverMatrix[i]?.[0]);
                if (eta != null) driverPickupEtaMin[driver.type] = eta;
              });
            } catch (err) {
              console.warn("[availability] driver matrix failed:", err);
            }
          }
        }

        const options = await Promise.all(
          BUYER_OPTIONS.map(async (opt) => {
            const count = nearby.filter(
              (d) => vehicleToFilterBucket(d.vehicle_type) === opt.type,
            ).length;

            let price = 0;
            try {
              const quote = await computeDeliveryQuote({
                pickupLat,
                pickupLng,
                deliveryLat,
                deliveryLng,
                weightKg,
                vehicleType: mapVehicleForQuote(opt.type),
              });
              price = quote.total;
              if (opt.type === "bicycle") price = Math.round(price * 0.85);
            } catch {
              price = 0;
            }

            const status = count > 0 ? "available" : "unavailable";
            const driverLeg = driverPickupEtaMin[opt.type] ?? 0;
            const tripLeg = routeEtaMin != null ? routeEtaMin * VEHICLE_ETA_FACTOR[opt.type] : null;
            const etaMin =
              tripLeg != null
                ? Math.max(3, Math.round(driverLeg + tripLeg))
                : undefined;

            return {
              type: opt.type,
              label: opt.label,
              icon: opt.icon,
              price,
              status,
              driversNearby: count,
              etaMin,
            };
          }),
        );

        const driversNearby = nearby.length;
        const coverageZone = discreetCoverageNearPickup(pickupLat, pickupLng, driversNearby);
        const nearbyPins = discreetDriverPinsNearPickup(
          pickupLat,
          pickupLng,
          nearby.map((d) => ({ id: d.id, vehicle_type: d.vehicle_type })),
        );

        return Response.json({
          options,
          radiusKm,
          routeEtaMin: routeEtaMin != null ? Math.round(routeEtaMin) : null,
          etaSource: routeEtaMin != null ? "mapbox_matrix" : null,
          driversNearby,
          coverageZone,
          nearbyPins,
        });
      },
    },
  },
});
