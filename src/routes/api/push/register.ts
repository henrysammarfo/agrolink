import { createFileRoute } from "@tanstack/react-router";
import { registerPushToken } from "@/server/push";
import { requireAuth } from "@/server/api-auth";

export const Route = createFileRoute("/api/push/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await requireAuth(request);
          if (auth instanceof Response) return auth;

          const body = (await request.json()) as {
            token: string;
            platform?: "web" | "android" | "ios";
          };
          if (!body.token) {
            return Response.json({ error: "Missing token" }, { status: 400 });
          }
          await registerPushToken(auth.userId, body.token, body.platform ?? "web");
          return Response.json({ ok: true });
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : "Register failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
