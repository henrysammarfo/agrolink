import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/server/api-auth";
import {
  ORDER_WITH_DELIVERY_SELECT,
  attachDriverProfiles,
  collectDriverUserIds,
} from "@/lib/order-enrich";

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
          .select(ORDER_WITH_DELIVERY_SELECT)
          .eq("buyer_id", auth.userId)
          .order("created_at", { ascending: false });

        if (orderId) {
          query = query.eq("id", orderId).limit(1);
        } else {
          query = query.limit(100);
        }

        const { data, error } = orderId ? await query.maybeSingle() : await query;
        if (error) return Response.json({ error: error.message }, { status: 500 });

        const rows = orderId ? (data ? [data] : []) : ((data ?? []) as Record<string, unknown>[]);
        const userIds = collectDriverUserIds(rows);

        let enriched = rows;
        if (userIds.length) {
          const { data: profiles, error: profileErr } = await supabaseAdmin
            .from("profiles")
            .select("id, display_name, avatar_url, phone, slug, username")
            .in("id", userIds);
          if (profileErr) return Response.json({ error: profileErr.message }, { status: 500 });
          enriched = attachDriverProfiles(rows, profiles ?? []);
        }

        if (orderId) {
          if (!enriched[0]) return Response.json({ error: "Order not found" }, { status: 404 });
          return Response.json({ order: enriched[0] });
        }

        return Response.json({ orders: enriched });
      },
    },
  },
});
