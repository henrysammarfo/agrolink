import { createFileRoute } from "@tanstack/react-router";
import { computeDeliveryQuote } from "@/server/delivery-quote";
import { requireAuth } from "@/server/api-auth";

export const Route = createFileRoute("/api/delivery/quote")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await requireAuth(request);
          if (auth instanceof Response) return auth;

          const body = (await request.json()) as {
            pickupLat: number;
            pickupLng: number;
            deliveryLat: number;
            deliveryLng: number;
            weightKg: number;
            vehicleType?: "motorcycle" | "pickup" | "truck" | "minivan";
            pickupStops?: { lat: number; lng: number; label?: string }[];
          };

          if (
            body.pickupLat == null ||
            body.pickupLng == null ||
            body.deliveryLat == null ||
            body.deliveryLng == null
          ) {
            return Response.json({ error: "Missing coordinates" }, { status: 400 });
          }

          const quote = await computeDeliveryQuote({
            pickupLat: body.pickupLat,
            pickupLng: body.pickupLng,
            deliveryLat: body.deliveryLat,
            deliveryLng: body.deliveryLng,
            weightKg: body.weightKg ?? 0,
            vehicleType: body.vehicleType,
            pickupStops: body.pickupStops,
          });

          return Response.json(quote);
        } catch (error) {
          console.error("[DeliveryQuote]", error);
          return Response.json(
            { error: error instanceof Error ? error.message : "Quote failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
