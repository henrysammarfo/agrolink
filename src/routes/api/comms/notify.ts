import { createFileRoute } from "@tanstack/react-router";
import { notifyUser } from "@/server/comms";
import { requireAuth } from "@/server/api-auth";

type Body = {
  type: "like" | "comment" | "follow";
  actorName?: string;
  listingId?: string;
  listingTitle?: string;
  farmerSlug?: string;
  sellerId?: string;
};

export const Route = createFileRoute("/api/comms/notify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await requireAuth(request);
          if (auth instanceof Response) return auth;

          const body = (await request.json()) as Body;
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          if (!body.type) {
            return Response.json({ error: "Missing type" }, { status: 400 });
          }

          const actor = body.actorName ?? "Someone";
          const actorUserId = auth.userId;

          if (body.type === "like" && body.sellerId && body.listingId) {
            if (body.sellerId === actorUserId) {
              return Response.json({ ok: true, skipped: true });
            }
            await notifyUser(body.sellerId, {
              type: "like",
              title: `${actor} liked your listing`,
              body: body.listingTitle ?? "Your produce",
              link: `/app/buyer/feed`,
            });
          }

          if (body.type === "comment" && body.sellerId && body.listingId) {
            if (body.sellerId === actorUserId) {
              return Response.json({ ok: true, skipped: true });
            }
            await notifyUser(body.sellerId, {
              type: "comment",
              title: `${actor} commented`,
              body: body.listingTitle ?? "On your listing",
              link: `/app/buyer/feed`,
            });
          }

          if (body.type === "follow" && body.farmerSlug) {
            const slug = body.farmerSlug.toLowerCase();
            const { data: profile } = await supabaseAdmin
              .from("profiles")
              .select("id")
              .or(`slug.eq.${slug},username.eq.${slug}`)
              .maybeSingle();
            if (profile?.id && profile.id !== actorUserId) {
              await notifyUser(profile.id, {
                type: "follow",
                title: `${actor} started following you`,
                body: "New follower on your farmer profile",
                link: `/farmers/${body.farmerSlug}`,
              });
            }
          }

          return Response.json({ ok: true });
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : "Notify failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
