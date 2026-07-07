import { createFileRoute } from "@tanstack/react-router";
import { verifyGhanaCard } from "@/server/hubtel";
import { requireAuth } from "@/server/api-auth";

export const Route = createFileRoute("/api/verify/ghana-card")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await requireAuth(request);
          if (auth instanceof Response) return auth;

          const body = (await request.json()) as {
            ghanaCardId: string;
            fullName?: string;
          };
          if (!body.ghanaCardId) {
            return Response.json({ error: "Ghana Card ID required" }, { status: 400 });
          }

          const result = await verifyGhanaCard({
            ghanaCardId: body.ghanaCardId,
            fullName: body.fullName,
          });

          if (result.verified) {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            await supabaseAdmin
              .from("driver_profiles")
              .update({
                ghana_card_verified: true,
                ghana_card_verified_at: new Date().toISOString(),
                ghana_card_id: body.ghanaCardId,
              })
              .eq("user_id", auth.userId);
          }

          return Response.json(result);
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
