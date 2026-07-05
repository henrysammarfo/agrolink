import { createFileRoute } from "@tanstack/react-router";
import { computeDeliveryQuote } from "@/server/delivery-quote";

export const Route = createFileRoute("/api/delivery/quote")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            pickupLat: number;
            pickupLng: number;
            deliveryLat: number;
            deliveryLng: number;
            weightKg: number;
            vehicleType?: "motorcycle" | "pickup" | "truck" | "minivan";
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
