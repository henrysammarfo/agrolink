import { createFileRoute } from "@tanstack/react-router";
import { completeDelivery } from "@/server/delivery-complete";

export const Route = createFileRoute("/api/deliveries/complete")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { deliveryId: string; userId: string };
          if (!body.deliveryId || !body.userId) {
            return Response.json({ error: "Missing fields" }, { status: 400 });
          }
          const result = await completeDelivery(body.deliveryId, body.userId);
          return Response.json(result);
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : "Complete failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
