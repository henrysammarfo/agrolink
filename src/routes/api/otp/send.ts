import { createFileRoute } from "@tanstack/react-router";
import { sendCheckoutOtp } from "@/server/checkout-otp";

export const Route = createFileRoute("/api/otp/send")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            userId: string;
            phone: string;
            email?: string;
            orderTotalGhs: number;
          };
          if (!body.userId || !body.phone) {
            return Response.json({ error: "Missing fields" }, { status: 400 });
          }
          const result = await sendCheckoutOtp({
            userId: body.userId,
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
