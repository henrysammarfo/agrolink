import { createFileRoute } from "@tanstack/react-router";
import { registerPushToken } from "@/server/push";

export const Route = createFileRoute("/api/push/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            userId: string;
            token: string;
            platform?: "web" | "android" | "ios";
          };
          if (!body.userId || !body.token) {
            return Response.json({ error: "Missing fields" }, { status: 400 });
          }
          await registerPushToken(body.userId, body.token, body.platform ?? "web");
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
