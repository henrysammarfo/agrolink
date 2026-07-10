import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/server/api-auth";

export const Route = createFileRoute("/api/buyer/orders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const url = new URL(request.url);
        const orderId = url.searchParams.get("orderId");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        let query = supabaseAdmin
          .from("orders")
          .select(
            `
            *,
            items:order_items(*, listing:listings(title, image_url)),
            delivery:deliveries(*, driver:driver_profiles(*, profile:profiles!driver_profiles_user_id_fkey(display_name, avatar_url, phone, slug, username)))
          `,
          )
          .eq("buyer_id", auth.userId)
          .order("created_at", { ascending: false });

        if (orderId) {
          query = query.eq("id", orderId).limit(1);
        } else {
          query = query.limit(100);
        }

        const { data, error } = orderId ? await query.maybeSingle() : await query;
        if (error) return Response.json({ error: error.message }, { status: 500 });

        if (orderId) {
          if (!data) return Response.json({ error: "Order not found" }, { status: 404 });
          return Response.json({ order: data });
        }

        return Response.json({ orders: data ?? [] });
      },
    },
  },
});
