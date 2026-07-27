import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/server/api-auth";

type Body = {
  listingId?: string;
  reason?: string;
};

export const Route = createFileRoute("/api/listings/report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await requireAuth(request);
          if (auth instanceof Response) return auth;

          const body = (await request.json()) as Body;
          if (!body.listingId) {
            return Response.json({ error: "Missing listingId" }, { status: 400 });
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const reason = (body.reason ?? "user_flag").slice(0, 200);

          const { error } = await supabaseAdmin.from("listing_reports").insert({
            listing_id: body.listingId,
            user_id: auth.userId,
            reason,
          });

          if (error) {
            if (error.message.includes("duplicate") || error.code === "23505") {
              return Response.json({ ok: true, alreadyReported: true });
            }
            return Response.json({ error: error.message }, { status: 400 });
          }

          const { data: listing } = await supabaseAdmin
            .from("listings")
            .select("report_count")
            .eq("id", body.listingId)
            .maybeSingle();

          await supabaseAdmin
            .from("listings")
            .update({ report_count: (listing?.report_count ?? 0) + 1 })
            .eq("id", body.listingId);

          return Response.json({ ok: true });
        } catch (e) {
          return Response.json(
            { error: e instanceof Error ? e.message : "Report failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
