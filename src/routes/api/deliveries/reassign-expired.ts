import { createFileRoute } from "@tanstack/react-router";
import { reassignExpiredDeliveries } from "@/server/delivery-reassign";

export const Route = createFileRoute("/api/deliveries/reassign-expired")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const result = await reassignExpiredDeliveries();
          return Response.json(result);
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : "Reassign failed" },
            { status: 500 },
          );
        }
      },
      GET: async () => {
        try {
          const result = await reassignExpiredDeliveries();
          return Response.json(result);
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : "Reassign failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
