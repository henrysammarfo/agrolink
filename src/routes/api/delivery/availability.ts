import { createFileRoute } from "@tanstack/react-router";
import { optionalAuth } from "@/server/api-auth";
import { haversineKm, radiusForOfferRound, vehicleToFilterBucket } from "@/lib/vehicle-types";
import { computeDeliveryQuote } from "@/server/delivery-quote";

const BUYER_OPTIONS = [
  { type: "bicycle" as const, label: "Bicycle", icon: "🚲" },
  { type: "motorcycle" as const, label: "Motor", icon: "🏍️" },
  { type: "car" as const, label: "Car", icon: "🚗" },
];

function mapVehicleForQuote(type: "bicycle" | "motorcycle" | "car") {
  if (type === "car") return "pickup" as const;
  if (type === "bicycle") return "motorcycle" as const;
  return "motorcycle" as const;
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
            return {
              type: opt.type,
              label: opt.label,
              icon: opt.icon,
              price,
              status,
              driversNearby: count,
            };
          }),
        );

        return Response.json({ options, radiusKm });
      },
    },
  },
});
