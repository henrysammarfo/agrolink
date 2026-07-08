import { createFileRoute } from "@tanstack/react-router";
import { processCheckout } from "@/server/paystack";
import { requireAuth } from "@/server/api-auth";

export const Route = createFileRoute("/api/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await requireAuth(request);
          if (auth instanceof Response) return auth;

          const body = (await request.json()) as {
            email?: string;
            phone: string;
            momoProvider?: "mtn" | "vod" | "atl";
            deliveryAddress?: string;
            deliveryLat?: number;
            deliveryLng?: number;
            fulfillmentMode?: "platform_delivery" | "farm_pickup" | "own_driver";
            otpVerified?: boolean;
          };

          if (!body.phone) {
            return Response.json({ error: "Missing phone" }, { status: 400 });
          }

          const accountEmail = auth.email?.trim().toLowerCase() ?? "";
          const checkoutEmail = (body.email ?? accountEmail).trim().toLowerCase();
          if (body.email && accountEmail && checkoutEmail !== accountEmail) {
            return Response.json({ error: "Email does not match signed-in account" }, { status: 403 });
          }

          const result = await processCheckout({
            userId: auth.userId,
            email: checkoutEmail || accountEmail,
            phone: body.phone,
            momoProvider: body.momoProvider ?? "mtn",
            deliveryAddress: body.deliveryAddress,
            deliveryLat: body.deliveryLat,
            deliveryLng: body.deliveryLng,
            fulfillmentMode: body.fulfillmentMode ?? "platform_delivery",
            otpVerified: body.otpVerified,
          });

          return Response.json(result);
        } catch (error) {
          console.error("[Checkout]", error);
          return Response.json(
            { error: error instanceof Error ? error.message : "Checkout failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
