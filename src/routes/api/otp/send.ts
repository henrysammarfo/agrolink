import { createFileRoute } from "@tanstack/react-router";
import { sendCheckoutOtp } from "@/server/checkout-otp";
import { requireAuth } from "@/server/api-auth";

export const Route = createFileRoute("/api/otp/send")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await requireAuth(request);
          if (auth instanceof Response) return auth;

          const body = (await request.json()) as {
            phone: string;
            email?: string;
            orderTotalGhs: number;
          };
          if (!body.phone) {
            return Response.json({ error: "Missing phone" }, { status: 400 });
          }
          const result = await sendCheckoutOtp({
            userId: auth.userId,
            phone: body.phone,
            email: body.email,
            orderTotalGhs: body.orderTotalGhs ?? 0,
          });
          return Response.json(result, { status: result.ok ? 200 : 502 });
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : "Send failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
