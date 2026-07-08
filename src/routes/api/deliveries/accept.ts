import { createFileRoute } from "@tanstack/react-router";
import { acceptDeliveryServer } from "@/server/driver-matching";
import { requireAuth } from "@/server/api-auth";

export const Route = createFileRoute("/api/deliveries/accept")({
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

          const result = await acceptDeliveryServer(
            body.deliveryId,
            body.driverProfileId,
            auth.userId,
          );

          if (!result.ok) {
            return Response.json({ error: result.error ?? "Accept failed" }, { status: 409 });
          }

          return Response.json({ ok: true });
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : "Accept failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
