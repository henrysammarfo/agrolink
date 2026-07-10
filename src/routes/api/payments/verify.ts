import { createFileRoute } from "@tanstack/react-router";
import { verifyAndConfirmPayment } from "@/server/paystack";
import { requireAuth } from "@/server/api-auth";

export const Route = createFileRoute("/api/payments/verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await requireAuth(request);
          if (auth instanceof Response) return auth;

          const body = (await request.json()) as { reference?: string };
          if (!body.reference) {
            return Response.json({ error: "Missing reference" }, { status: 400 });
          }

          const result = await verifyAndConfirmPayment(body.reference);
          return Response.json(result, { status: result.ok ? 200 : 402 });
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
