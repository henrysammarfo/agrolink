import { createFileRoute } from "@tanstack/react-router";
import { reserveOrderForDriverMatch } from "@/server/paystack";
import { requireAuth } from "@/server/api-auth";

export const Route = createFileRoute("/api/checkout/reserve")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await requireAuth(request);
          if (auth instanceof Response) return auth;

          const body = (await request.json()) as {
            deliveryAddress?: string;
            deliveryLat?: number;
            deliveryLng?: number;
            vehicleType?: "bicycle" | "motorcycle" | "car";
            otpVerified?: boolean;
          };

          const result = await reserveOrderForDriverMatch({
            userId: auth.userId,
            deliveryAddress: body.deliveryAddress,
            deliveryLat: body.deliveryLat,
            deliveryLng: body.deliveryLng,
            vehicleType: body.vehicleType,
            otpVerified: body.otpVerified,
          });

          return Response.json(result);
        } catch (error) {
          console.error("[Checkout reserve]", error);
          return Response.json(
            { error: error instanceof Error ? error.message : "Could not request driver" },
            { status: 500 },
          );
        }
      },
    },
  },
});
