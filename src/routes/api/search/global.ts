import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/search/global")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
        const userId = url.searchParams.get("userId");
        const role = url.searchParams.get("role") ?? "buyer";
        if (q.length < 2) return Response.json({ listings: [], farmers: [], orders: [] });

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const listingsP = supabaseAdmin
            .from("feed_rank")
            .select("id, title, seller_name, price_per_unit, unit, image_url, seller_slug")
            .or(`title.ilike.%${q}%,location_name.ilike.%${q}%`)
            .limit(8);

          const farmersP = supabaseAdmin
            .from("profiles")
            .select("id, display_name, slug, region, avatar_url")
            .or(`display_name.ilike.%${q}%,slug.ilike.%${q}%,region.ilike.%${q}%`)
            .limit(6);

          const ordersP =
            userId && role === "buyer"
              ? supabaseAdmin
                  .from("orders")
                  .select("id, status, total_amount, created_at")
                  .eq("buyer_id", userId)
                  .limit(20)
              : Promise.resolve({ data: [] });

          const [listings, farmers, ordersRes] = await Promise.all([listingsP, farmersP, ordersP]);
          if (listings.error) throw listings.error;
          if (farmers.error) throw farmers.error;
          const orders = (ordersRes.data ?? []).filter(
            (o: { id: string }) => o.id.toLowerCase().includes(q) || q.length >= 3,
          );

          return Response.json({
            listings: listings.data ?? [],
            farmers: farmers.data ?? [],
            orders: orders.slice(0, 6),
          });
        } catch (e) {
          console.warn("[Search] Supabase unavailable", e);
          return Response.json({ listings: [], farmers: [], orders: [] });
        }
      },
    },
  },
});
