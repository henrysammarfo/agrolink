import { createFileRoute } from "@tanstack/react-router";
import { completeDelivery } from "@/server/delivery-complete";
import { requireAuth } from "@/server/api-auth";

export const Route = createFileRoute("/api/deliveries/complete")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await requireAuth(request);
          if (auth instanceof Response) return auth;

          const body = (await request.json()) as {
            deliveryId: string;
            podPhotoUrl?: string;
          };
          if (!body.deliveryId) {
            return Response.json({ error: "Missing deliveryId" }, { status: 400 });
          }
          const result = await completeDelivery(body.deliveryId, auth.userId, body.podPhotoUrl);
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
