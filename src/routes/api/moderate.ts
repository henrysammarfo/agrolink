import { createFileRoute } from "@tanstack/react-router";
import {
  moderateListingContent,
  fetchPriceAdvice,
  ingestMarketPricesFromTinyFish,
} from "@/server/ai";

export const Route = createFileRoute("/api/moderate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            action: "moderate" | "price_advice" | "ingest_prices";
            title?: string;
            description?: string;
            hashtags?: string[];
            cropType?: string;
            region?: string;
            myPrice?: number;
            listingId?: string;
          };

          if (body.action === "price_advice") {
            const result = await fetchPriceAdvice(
              body.cropType ?? "tomato",
              body.region ?? "Greater Accra",
              body.myPrice,
            );
            return Response.json(result);
          }

          if (body.action === "ingest_prices") {
            const count = await ingestMarketPricesFromTinyFish();
            return Response.json({ ingested: count });
          }

          const result = await moderateListingContent({
            title: body.title ?? "",
            description: body.description,
            hashtags: body.hashtags,
          });

          if (result.passed && body.listingId) {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            await supabaseAdmin.from("ai_analysis").upsert(
              {
                listing_id: body.listingId,
                quality_grade: result.qualityGrade,
                demand_score: result.demandScore,
                price_advice: result.priceAdvice,
                insights: result.insights,
                moderation_passed: true,
              },
              { onConflict: "listing_id" },
            );
            await supabaseAdmin
              .from("listings")
              .update({ status: "active" })
              .eq("id", body.listingId);
          } else if (!result.passed && body.listingId) {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            await supabaseAdmin.from("ai_analysis").upsert(
              {
                listing_id: body.listingId,
                moderation_passed: false,
                moderation_reason: result.reason,
              },
              { onConflict: "listing_id" },
            );
            await supabaseAdmin
              .from("listings")
              .update({ status: "rejected" })
              .eq("id", body.listingId);
          }

          return Response.json(result);
        } catch (error) {
          console.error("[Moderate]", error);
          return Response.json({ error: "Moderation failed" }, { status: 500 });
        }
      },
    },
  },
});
