import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/server/api-auth";
import {
  acceptMessageRequest,
  declineMessageRequest,
  blockMessageRequest,
} from "@/server/message-permissions";

export const Route = createFileRoute("/api/chat/request")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await requireAuth(request);
          if (auth instanceof Response) return auth;

          const body = (await request.json()) as {
            action?: "accept" | "decline" | "block";
            requesterId?: string;
          };

          if (!body.requesterId || !body.action) {
            return Response.json({ error: "Missing action or requesterId" }, { status: 400 });
          }

          if (body.action === "accept") {
            await acceptMessageRequest(auth.userId, body.requesterId);
          } else if (body.action === "decline") {
            await declineMessageRequest(auth.userId, body.requesterId);
          } else {
            await blockMessageRequest(auth.userId, body.requesterId);
          }

          return Response.json({ ok: true });
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : "Request action failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
