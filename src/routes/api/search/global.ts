import { createFileRoute } from "@tanstack/react-router";
import { escapeIlike, optionalAuth } from "@/server/api-auth";

export const Route = createFileRoute("/api/search/global")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const q = escapeIlike((url.searchParams.get("q") ?? "").trim().toLowerCase());
        const role = url.searchParams.get("role") ?? "buyer";
        if (q.length < 2) return Response.json({ listings: [], farmers: [], orders: [], hashtags: [] });

        const auth = await optionalAuth(request);

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const listingsP = supabaseAdmin
            .from("feed_rank")
            .select("id, title, seller_name, price_per_unit, unit, image_url, seller_slug, hashtags")
            .or(`title.ilike.%${q}%,location_name.ilike.%${q}%`)
            .limit(8);

          const tagListingsP = supabaseAdmin
            .from("feed_rank")
            .select("id, title, seller_name, price_per_unit, unit, image_url, seller_slug, hashtags")
            .contains("hashtags", [q.replace(/^#/, "")])
            .limit(6);

          const farmersP = supabaseAdmin
            .from("profiles")
            .select("id, display_name, slug, username, region, avatar_url")
            .or(`display_name.ilike.%${q}%,slug.ilike.%${q}%,username.ilike.%${q}%,region.ilike.%${q}%`)
            .limit(8);

          const ordersP =
            auth && role === "buyer"
              ? supabaseAdmin
                  .from("orders")
                  .select("id, status, total_amount, created_at")
                  .eq("buyer_id", auth.userId)
                  .limit(20)
              : Promise.resolve({ data: [], error: null });

          const [listings, tagListings, farmers, ordersRes] = await Promise.all([
            listingsP,
            tagListingsP,
            farmersP,
            ordersP,
          ]);
          if (listings.error) throw listings.error;
          if (farmers.error) throw farmers.error;

          const mergedListings = [
            ...(listings.data ?? []),
            ...(tagListings.data ?? []).filter((t) => !(listings.data ?? []).some((l) => l.id === t.id)),
          ].slice(0, 8);

          const hashtags = [...new Set(
            mergedListings.flatMap((l) => (l.hashtags as string[] | null) ?? []).filter((h) => h.toLowerCase().includes(q)),
          )].slice(0, 6);

          const orders = (ordersRes.data ?? []).filter(
            (o: { id: string }) => o.id.toLowerCase().includes(q) || q.length >= 3,
          );

          return Response.json({
            listings: mergedListings,
            farmers: farmers.data ?? [],
            orders: orders.slice(0, 6),
            hashtags,
          });
        } catch (e) {
          console.warn("[Search] Supabase unavailable", e);
          return Response.json({ listings: [], farmers: [], orders: [], hashtags: [] });
        }
      },
    },
  },
});
