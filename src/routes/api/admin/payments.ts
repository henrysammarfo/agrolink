import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@/server/api-auth";

export const Route = createFileRoute("/api/admin/payments")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdmin(request);
        if (auth instanceof Response) return auth;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("payments")
          .select(
            "*, order:orders(id, buyer_id, total_amount, status, items:order_items(seller_id, listing:listings(title)))",
          )
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ payments: data ?? [] });
      },
      PATCH: async ({ request }) => {
        const auth = await requireAdmin(request);
        if (auth instanceof Response) return auth;

        const body = (await request.json()) as {
          paymentId: string;
          status: string;
          note?: string;
        };

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin
          .from("payments")
          .update({
            status: body.status,
            updated_at: new Date().toISOString(),
            metadata: body.note ? { admin_note: body.note } : undefined,
          })
          .eq("id", body.paymentId);

        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ ok: true });
      },
    },
  },
});
