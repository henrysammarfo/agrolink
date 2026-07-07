import { createFileRoute } from "@tanstack/react-router";
import { verifyCheckoutOtp } from "@/server/checkout-otp";
import { requireAuth } from "@/server/api-auth";

export const Route = createFileRoute("/api/otp/verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await requireAuth(request);
          if (auth instanceof Response) return auth;

          const body = (await request.json()) as { code: string };
          if (!body.code) {
            return Response.json({ error: "Missing code" }, { status: 400 });
          }
          const result = await verifyCheckoutOtp({
            userId: auth.userId,
            code: body.code,
          });
          return Response.json(result, { status: result.ok ? 200 : 400 });
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : "Verify failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
