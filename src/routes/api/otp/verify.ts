import { createFileRoute } from "@tanstack/react-router";
import { verifyCheckoutOtp } from "@/server/checkout-otp";

export const Route = createFileRoute("/api/otp/verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { userId: string; code: string };
          if (!body.userId || !body.code) {
            return Response.json({ error: "Missing fields" }, { status: 400 });
          }
          const result = await verifyCheckoutOtp({
            userId: body.userId,
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
