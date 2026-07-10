import { createFileRoute } from "@tanstack/react-router";
import { verifyAndConfirmPayment, notifyDriversForPaidOrder } from "@/server/paystack";
import { requireAuth } from "@/server/api-auth";

export const Route = createFileRoute("/api/orders/verify-payment")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await requireAuth(request);
          if (auth instanceof Response) return auth;

          const body = (await request.json()) as { orderId?: string };
          if (!body.orderId) {
            return Response.json({ error: "Missing orderId" }, { status: 400 });
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: order } = await supabaseAdmin
            .from("orders")
            .select("id, buyer_id, payment_status")
            .eq("id", body.orderId)
            .maybeSingle();

          if (!order || order.buyer_id !== auth.userId) {
            return Response.json({ error: "Order not found" }, { status: 404 });
          }
          if (order.payment_status === "paid") {
            await notifyDriversForPaidOrder(order.id);
            return Response.json({ ok: true, message: "Already paid", orderId: order.id });
          }

          const { data: payment } = await supabaseAdmin
            .from("payments")
            .select("idempotency_key")
            .eq("order_id", body.orderId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!payment?.idempotency_key) {
            return Response.json({ error: "Payment not found" }, { status: 404 });
          }

          const result = await verifyAndConfirmPayment(payment.idempotency_key);
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
