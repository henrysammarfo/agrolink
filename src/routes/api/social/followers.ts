import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/social/followers")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const slug = new URL(request.url).searchParams.get("slug")?.trim().toLowerCase();
        if (!slug) return Response.json({ error: "slug required" }, { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id, slug, username")
          .or(`slug.eq.${slug},username.eq.${slug}`)
          .maybeSingle();

        const farmerKey = profile?.slug?.toLowerCase() ?? slug;

        const { data: rows, error } = await supabaseAdmin
          .from("follows")
          .select("follower_id, created_at")
          .eq("farmer_slug", farmerKey)
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) return Response.json({ error: error.message }, { status: 500 });

        const ids = (rows ?? []).map((r) => r.follower_id);
        if (!ids.length) return Response.json({ users: [] });

        const { data: users } = await supabaseAdmin
          .from("profiles")
          .select("id, display_name, avatar_url, slug, username, region")
          .in("id", ids);

        const userMap = new Map((users ?? []).map((u) => [u.id, u]));
        const result = (rows ?? []).map((r) => ({
          ...userMap.get(r.follower_id),
          followed_at: r.created_at,
        }));

        return Response.json({ users: result.filter((u) => u?.id) });
      },
    },
  },
});
