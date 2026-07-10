import { createFileRoute } from "@tanstack/react-router";
import { cancelPendingCheckoutOrder } from "@/server/paystack";
import { requireAuth } from "@/server/api-auth";

export const Route = createFileRoute("/api/checkout/cancel")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await requireAuth(request);
          if (auth instanceof Response) return auth;

          const body = (await request.json()) as { orderId?: string };
          if (!body.orderId) {
            return Response.json({ error: "Missing orderId" }, { status: 400 });
          }

          const result = await cancelPendingCheckoutOrder({
            userId: auth.userId,
            orderId: body.orderId,
          });

          return Response.json(result);
        } catch (error) {
          console.error("[Checkout cancel]", error);
          return Response.json(
            { error: error instanceof Error ? error.message : "Could not cancel trip" },
            { status: 400 },
          );
        }
      },
    },
  },
});
