import { createFileRoute } from "@tanstack/react-router";
import { processCheckout } from "@/server/paystack";

export const Route = createFileRoute("/api/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            userId: string;
            email: string;
            phone: string;
            momoProvider?: "mtn" | "vod" | "atl";
            deliveryAddress?: string;
            deliveryLat?: number;
            deliveryLng?: number;
          };

          if (!body.userId || !body.email || !body.phone) {
            return Response.json({ error: "Missing required fields" }, { status: 400 });
          }

          const result = await processCheckout({
            userId: body.userId,
            email: body.email,
            phone: body.phone,
            momoProvider: body.momoProvider ?? "mtn",
            deliveryAddress: body.deliveryAddress,
            deliveryLat: body.deliveryLat,
            deliveryLng: body.deliveryLng,
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
