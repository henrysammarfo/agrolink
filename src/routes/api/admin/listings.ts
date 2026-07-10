import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@/server/api-auth";

export const Route = createFileRoute("/api/admin/listings")({
  server: {
    handlers: {
      PATCH: async ({ request }) => {
        const auth = await requireAdmin(request);
        if (auth instanceof Response) return auth;

        const body = (await request.json()) as {
          listingId: string;
          status: "active" | "rejected" | "inactive";
        };

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin
          .from("listings")
          .update({ status: body.status, updated_at: new Date().toISOString() })
          .eq("id", body.listingId);

        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ ok: true });
      },
    },
  },
});
