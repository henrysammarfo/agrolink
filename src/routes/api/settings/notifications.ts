import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/settings/notifications")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const userId = url.searchParams.get("userId");
        if (!userId) return Response.json({ error: "Missing userId" }, { status: 400 });
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data } = await supabaseAdmin
            .from("profiles")
            .select("whatsapp_enabled, push_enabled, marketing_enabled")
            .eq("id", userId)
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
        const body = (await request.json()) as {
          userId: string;
          whatsapp?: boolean;
          push?: boolean;
          marketing?: boolean;
        };
        if (!body.userId) return Response.json({ error: "Missing userId" }, { status: 400 });
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const updates: Record<string, boolean> = {};
          if (body.whatsapp !== undefined) updates.whatsapp_enabled = body.whatsapp;
          if (body.push !== undefined) updates.push_enabled = body.push;
          if (body.marketing !== undefined) updates.marketing_enabled = body.marketing;
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq("id", body.userId);
          if (error) return Response.json({ error: error.message }, { status: 500 });
          return Response.json({ ok: true });
        } catch {
          return Response.json({ ok: true, demo: true });
        }
      },
    },
  },
});
