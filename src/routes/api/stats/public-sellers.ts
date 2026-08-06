import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/stats/public-sellers")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 12) || 12, 1), 48);

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { data: listingRows, error: lErr } = await supabaseAdmin
            .from("listings")
            .select("seller_id")
            .eq("status", "active");
          if (lErr) throw lErr;

          const ids = [...new Set((listingRows ?? []).map((r) => r.seller_id).filter(Boolean))];
          if (!ids.length) {
            return Response.json(
              { sellers: [] },
              { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
            );
          }

          const { data, error } = await supabaseAdmin
            .from("profiles")
            .select(
              "id, display_name, avatar_url, bio, region, slug, username, verified, seller_rating, seller_rating_count, listing_count, follower_count",
            )
            .in("id", ids)
            .order("seller_rating", { ascending: false })
            .limit(limit);
          if (error) throw error;

          return Response.json(
            { sellers: data ?? [] },
            { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
          );
        } catch (err) {
          console.error("[public-sellers]", err);
          return Response.json({ error: "Failed to load sellers" }, { status: 500 });
        }
      },
    },
  },
});
