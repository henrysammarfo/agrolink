import { createFileRoute } from "@tanstack/react-router";

export type MarketingStats = {
  sellers: number;
  activeListings: number;
  completedOrders: number;
  gmv: number;
};

export const Route = createFileRoute("/api/stats/marketing")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const [listingsRes, ordersRes, paymentsRes, farmersRes] = await Promise.all([
            supabaseAdmin.from("feed_rank").select("seller_id"),
            supabaseAdmin
              .from("orders")
              .select("total_amount, status, payment_status")
              .in("status", ["delivered"]),
            supabaseAdmin.from("payments").select("amount").eq("status", "paid"),
            supabaseAdmin.from("user_roles").select("user_id").eq("role", "farmer"),
          ]);

          if (listingsRes.error) throw listingsRes.error;
          if (ordersRes.error) throw ordersRes.error;
          if (paymentsRes.error) throw paymentsRes.error;
          if (farmersRes.error) throw farmersRes.error;

          const listingRows = listingsRes.data ?? [];
          const sellersFromListings = new Set(listingRows.map((r) => r.seller_id)).size;
          const farmers = new Set((farmersRes.data ?? []).map((r) => r.user_id)).size;

          const paidFromPayments = (paymentsRes.data ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
          const paidFromOrders = (ordersRes.data ?? [])
            .filter((o) => o.payment_status === "paid")
            .reduce((sum, o) => sum + Number(o.total_amount), 0);

          const stats: MarketingStats = {
            activeListings: listingRows.length,
            completedOrders: ordersRes.data?.length ?? 0,
            gmv: paidFromPayments > 0 ? paidFromPayments : paidFromOrders,
            sellers: Math.max(sellersFromListings, farmers),
          };

          return Response.json(stats, {
            headers: {
              "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
            },
          });
        } catch (err) {
          console.error("[marketing-stats]", err);
          return Response.json({ error: "Failed to load stats" }, { status: 500 });
        }
      },
    },
  },
});
