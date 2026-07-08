import { createFileRoute } from "@tanstack/react-router";
import { declineDeliveryServer } from "@/server/driver-matching";
import { requireAuth } from "@/server/api-auth";

export const Route = createFileRoute("/api/deliveries/decline")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await requireAuth(request);
          if (auth instanceof Response) return auth;

          const body = (await request.json()) as {
            deliveryId?: string;
            driverProfileId?: string;
          };

          if (!body.deliveryId || !body.driverProfileId) {
            return Response.json({ error: "Missing deliveryId or driverProfileId" }, { status: 400 });
          }

          const result = await declineDeliveryServer(
            body.deliveryId,
            body.driverProfileId,
            auth.userId,
          );

          if (!result.ok) {
            return Response.json({ error: "Decline failed" }, { status: 400 });
          }

          return Response.json({ ok: true });
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : "Decline failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
