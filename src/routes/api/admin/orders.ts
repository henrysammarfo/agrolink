import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@/server/api-auth";

export const Route = createFileRoute("/api/admin/orders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdmin(request);
        if (auth instanceof Response) return auth;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("orders")
          .select(
            "*, items:order_items(*, listing:listings(title)), delivery:deliveries(status, driver_id)",
          )
          .order("created_at", { ascending: false })
          .limit(200);

        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ orders: data ?? [] });
      },
    },
  },
});
