import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/listings/comments")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const listingId = url.searchParams.get("listingId");
        if (!listingId) {
          return Response.json({ error: "Missing listingId" }, { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: rows, error } = await supabaseAdmin
          .from("listing_comments")
          .select("id, user_id, content, created_at")
          .eq("listing_id", listingId)
          .order("created_at", { ascending: false });

        if (error) {
          return Response.json({ error: error.message }, { status: 500 });
        }

        const userIds = [...new Set((rows ?? []).map((r) => r.user_id))];
        const nameById = new Map<string, string>();
        if (userIds.length) {
          const { data: profiles } = await supabaseAdmin
            .from("profiles")
            .select("id, display_name")
            .in("id", userIds);
          for (const p of profiles ?? []) {
            if (p.display_name) nameById.set(p.id, p.display_name);
          }
        }

        const comments = (rows ?? []).map((c) => ({
          id: c.id,
          user_id: c.user_id,
          author: nameById.get(c.user_id) ?? "User",
          content: c.content,
          created_at: c.created_at,
        }));

        return Response.json({ comments });
      },
    },
  },
});
