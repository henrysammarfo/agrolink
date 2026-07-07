import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin, requireAuth } from "@/server/api-auth";

export const Route = createFileRoute("/api/admin/pricing")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin
            .from("delivery_pricing_config")
            .select("*")
            .eq("active", true)
            .limit(1)
            .maybeSingle();
          if (error) return Response.json({ error: error.message }, { status: 500 });
          return Response.json({ config: data });
        } catch {
          return Response.json({
            config: {
              id: "demo",
              name: "default",
              base_fare: 8,
              per_km_rate: 2.5,
              surge_multiplier: 1,
              surge_active: false,
              surge_reason: null,
              peak_multiplier: 1.2,
            },
          });
        }
      },
      PATCH: async ({ request }) => {
        const auth = await requireAdmin(request);
        if (auth instanceof Response) return auth;

        const body = (await request.json()) as {
          surge_multiplier?: number;
          surge_active?: boolean;
          surge_reason?: string;
        };

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: cfg } = await supabaseAdmin
          .from("delivery_pricing_config")
          .select("id")
          .eq("active", true)
          .limit(1)
          .maybeSingle();
        if (!cfg) return Response.json({ error: "No active config" }, { status: 404 });

        const updates: Record<string, unknown> = {};
        if (body.surge_multiplier !== undefined) updates.surge_multiplier = body.surge_multiplier;
        if (body.surge_active !== undefined) updates.surge_active = body.surge_active;
        if (body.surge_reason !== undefined) updates.surge_reason = body.surge_reason;

        const { data, error } = await supabaseAdmin
          .from("delivery_pricing_config")
          .update(updates)
          .eq("id", cfg.id)
          .select("*")
          .single();
        if (error) return Response.json({ error: error.message }, { status: 500 });

        await supabaseAdmin.from("audit_log").insert({
          actor_id: auth.userId,
          action: "surge_pricing_update",
          entity_type: "delivery_pricing_config",
          entity_id: cfg.id,
          metadata: updates,
        });

        return Response.json({ config: data });
      },
    },
  },
});
