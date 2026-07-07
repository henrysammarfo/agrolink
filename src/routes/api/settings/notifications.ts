import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/server/api-auth";

export const Route = createFileRoute("/api/settings/notifications")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data } = await supabaseAdmin
            .from("profiles")
            .select("whatsapp_enabled, push_enabled, marketing_enabled")
            .eq("id", auth.userId)
            .maybeSingle();
          return Response.json({
            whatsapp: data?.whatsapp_enabled ?? true,
            push: data?.push_enabled ?? true,
            marketing: data?.marketing_enabled ?? false,
          });
        } catch {
          return Response.json({ whatsapp: true, push: true, marketing: false });
        }
      },
      POST: async ({ request }) => {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const body = (await request.json()) as {
          whatsapp?: boolean;
          push?: boolean;
          marketing?: boolean;
        };

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const updates: Record<string, boolean> = {};
          if (body.whatsapp !== undefined) updates.whatsapp_enabled = body.whatsapp;
          if (body.push !== undefined) updates.push_enabled = body.push;
          if (body.marketing !== undefined) updates.marketing_enabled = body.marketing;
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq("id", auth.userId);
          if (error) return Response.json({ error: error.message }, { status: 500 });
          return Response.json({ ok: true });
        } catch {
          return Response.json({ ok: true, demo: true });
        }
      },
    },
  },
});
