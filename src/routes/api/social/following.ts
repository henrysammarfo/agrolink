import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/server/api-auth";

type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  slug: string | null;
  username: string | null;
  region: string | null;
  follower_count: number | null;
};

export const Route = createFileRoute("/api/social/following")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: rows, error } = await supabaseAdmin
          .from("follows")
          .select("farmer_slug, created_at")
          .eq("follower_id", auth.userId)
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) return Response.json({ error: error.message }, { status: 500 });

        const slugs = [...new Set((rows ?? []).map((r) => r.farmer_slug.toLowerCase()))];
        if (!slugs.length) return Response.json({ users: [] });

        const slugList = slugs.join(",");
        const { data: profiles } = await supabaseAdmin
          .from("profiles")
          .select("id, display_name, avatar_url, slug, username, region, follower_count")
          .or(`slug.in.(${slugList}),username.in.(${slugList})`);

        const bySlug = new Map<string, ProfileRow>();
        for (const p of (profiles ?? []) as ProfileRow[]) {
          if (p.slug) bySlug.set(p.slug.toLowerCase(), p);
          if (p.username) bySlug.set(p.username.toLowerCase(), p);
        }

        const { data: myProfile } = await supabaseAdmin
          .from("profiles")
          .select("slug")
          .eq("id", auth.userId)
          .maybeSingle();
        const mySlug = myProfile?.slug?.toLowerCase();

        const result: (ProfileRow & { followed_at: string })[] = [];
        for (const r of rows ?? []) {
          const p = bySlug.get(r.farmer_slug.toLowerCase());
          if (p) result.push({ ...p, followed_at: r.created_at });
        }

        let followsYouSet = new Set<string>();
        if (mySlug && result.length) {
          const ids = result.map((p) => p.id);
          const { data: backFollows } = await supabaseAdmin
            .from("follows")
            .select("follower_id")
            .eq("farmer_slug", mySlug)
            .in("follower_id", ids);
          followsYouSet = new Set((backFollows ?? []).map((f) => f.follower_id));
        }

        return Response.json({
          users: result.map((p) => ({
            ...p,
            follows_you: followsYouSet.has(p.id),
          })),
        });
      },
    },
  },
});
