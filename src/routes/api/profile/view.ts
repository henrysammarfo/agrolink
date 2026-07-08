import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/server/api-auth";
import { recordProfileView } from "@/server/profile-views";

export const Route = createFileRoute("/api/profile/view")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await requireAuth(request);
          if (auth instanceof Response) return auth;

          const body = (await request.json()) as { profileId?: string };
          if (!body.profileId) {
            return Response.json({ error: "Missing profileId" }, { status: 400 });
          }

          const result = await recordProfileView(body.profileId, auth.userId);
          return Response.json(result);
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : "View failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
