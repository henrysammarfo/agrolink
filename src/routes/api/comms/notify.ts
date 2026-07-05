import { createFileRoute } from "@tanstack/react-router";
import { notifyUser } from "@/server/comms";

type Body = {
  type: "like" | "comment" | "follow";
  actorUserId: string;
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
          const body = (await request.json()) as Body;
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          if (!body.actorUserId || !body.type) {
            return Response.json({ error: "Missing fields" }, { status: 400 });
          }

          const actor = body.actorName ?? "Someone";

          if (body.type === "like" && body.sellerId && body.listingId) {
            if (body.sellerId === body.actorUserId) {
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
            if (body.sellerId === body.actorUserId) {
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
            const { data: profile } = await supabaseAdmin
              .from("profiles")
              .select("id")
              .eq("slug", body.farmerSlug)
              .maybeSingle();
            if (profile?.id && profile.id !== body.actorUserId) {
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
