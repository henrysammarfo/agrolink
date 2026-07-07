import { createFileRoute } from "@tanstack/react-router";
import { reassignExpiredDeliveries } from "@/server/delivery-reassign";
import { requireAuth, requireCronSecret, userHasRole } from "@/server/api-auth";

async function handleReassign(request: Request) {
  if (requireCronSecret(request)) {
    const result = await reassignExpiredDeliveries();
    return Response.json(result);
  }

  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const allowed =
    (await userHasRole(auth.userId, "transport")) || (await userHasRole(auth.userId, "admin"));
  if (!allowed) {
    return Response.json({ error: "Forbidden: driver or admin only" }, { status: 403 });
  }

  const result = await reassignExpiredDeliveries();
  return Response.json(result);
}

export const Route = createFileRoute("/api/deliveries/reassign-expired")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          return await handleReassign(request);
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : "Reassign failed" },
            { status: 500 },
          );
        }
      },
      GET: async ({ request }) => {
        try {
          return await handleReassign(request);
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
