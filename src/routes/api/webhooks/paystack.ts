import { createFileRoute } from "@tanstack/react-router";
import { handlePaystackWebhook } from "@/server/paystack";

export const Route = createFileRoute("/api/webhooks/paystack")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const signature = request.headers.get("x-paystack-signature");
        const result = await handlePaystackWebhook(rawBody, signature);
        return Response.json(result, { status: result.ok ? 200 : 401 });
      },
    },
  },
});
