import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/server/api-auth";
import { haversineKm, radiusForOfferRound, vehicleCanFulfill } from "@/lib/vehicle-types";
import { attachBuyerProfiles, collectBuyerUserIds } from "@/lib/order-enrich";

export const Route = createFileRoute("/api/deliveries/available")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: driver, error: dErr } = await supabaseAdmin
          .from("driver_profiles")
          .select("id, user_id, vehicle_type, current_lat, current_lng, verification_status, available")
          .eq("user_id", auth.userId)
          .maybeSingle();

        if (dErr) return Response.json({ error: dErr.message }, { status: 500 });
        if (!driver) return Response.json({ deliveries: [] });
        if (driver.verification_status !== "approved") {
          return Response.json({ deliveries: [], warning: "Driver not verified" });
        }

        const { data: rows, error } = await supabaseAdmin
          .from("deliveries")
          .select(
            `
            *,
            order:orders(buyer_id, total_amount, payment_status)
          `,
          )
          .eq("status", "requested")
          .is("driver_id", null)
          .order("created_at", { ascending: false });

        if (error) return Response.json({ error: error.message }, { status: 500 });

        const filtered = (rows ?? []).filter((job) => {
          const order = job.order as { buyer_id?: string; total_amount?: number; payment_status?: string } | null;
          const payStatus = order?.payment_status;
          if (payStatus !== "paid") return false;

          const declined = ((job.declined_driver_ids ?? []) as string[]);
          if (declined.includes(driver.id)) return false;

          const req = job.required_vehicle_type as string | null;
          if (!vehicleCanFulfill(driver.vehicle_type, req)) return false;

          const round = job.offer_round ?? 1;
          const radiusKm = Number(job.search_radius_km ?? radiusForOfferRound(round));

          if (driver.current_lat != null && driver.current_lng != null) {
            const dist = haversineKm(
              { lat: job.pickup_lat, lng: job.pickup_lng },
              { lat: driver.current_lat, lng: driver.current_lng },
            );
            if (dist > radiusKm) return false;
          }

          return true;
        });

        const buyerIds = collectBuyerUserIds(filtered);
        let enriched = filtered;
        if (buyerIds.length) {
          const { data: profiles, error: pErr } = await supabaseAdmin
            .from("profiles")
            .select("id, display_name, avatar_url, phone, slug, username")
            .in("id", buyerIds);
          if (pErr) return Response.json({ error: pErr.message }, { status: 500 });
          enriched = attachBuyerProfiles(filtered, profiles ?? []);
        }

        return Response.json({ deliveries: enriched });
      },
    },
  },
});
