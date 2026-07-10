import { createFileRoute } from "@tanstack/react-router";
import { initiatePaymentForOrder } from "@/server/paystack";
import { requireAuth } from "@/server/api-auth";

export const Route = createFileRoute("/api/checkout/pay")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await requireAuth(request);
          if (auth instanceof Response) return auth;

          const body = (await request.json()) as {
            orderId: string;
            email?: string;
            phone: string;
            momoProvider?: "mtn" | "vod" | "atl";
          };

          if (!body.orderId || !body.phone) {
            return Response.json({ error: "Missing orderId or phone" }, { status: 400 });
          }

          const accountEmail = auth.email?.trim().toLowerCase() ?? "";
          const checkoutEmail = (body.email ?? accountEmail).trim().toLowerCase();

          const result = await initiatePaymentForOrder({
            userId: auth.userId,
            orderId: body.orderId,
            email: checkoutEmail || accountEmail,
            phone: body.phone,
            momoProvider: body.momoProvider ?? "mtn",
          });

          return Response.json(result);
        } catch (error) {
          console.error("[Checkout pay]", error);
          return Response.json(
            { error: error instanceof Error ? error.message : "Payment failed" },
            { status: 400 },
          );
        }
      },
    },
  },
});
