import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@/server/api-auth";

const PENDING_STATUSES = ["pending", "submitted", "under_review"] as const;

async function signedDocUrl(path: string): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.storage.from("driver-documents").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export const Route = createFileRoute("/api/admin/drivers")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdmin(request);
        if (auth instanceof Response) return auth;

        const url = new URL(request.url);
        const status = url.searchParams.get("status") ?? "pending";

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        let query = supabaseAdmin
          .from("driver_profiles")
          .select("*")
          .order("updated_at", { ascending: false });

        if (status === "pending") {
          query = query.in("verification_status", [...PENDING_STATUSES]);
        } else if (status !== "all") {
          query = query.eq("verification_status", status);
        }

        const { data: drivers, error } = await query;
        if (error) return Response.json({ error: error.message }, { status: 500 });

        const items = await Promise.all(
          (drivers ?? []).map(async (driver) => {
            const [{ data: profile }, { data: docs }, authUser] = await Promise.all([
              supabaseAdmin
                .from("profiles")
                .select("display_name, phone, region, slug, avatar_url")
                .eq("id", driver.user_id)
                .maybeSingle(),
              supabaseAdmin
                .from("driver_documents")
                .select("id, doc_type, status, file_url, reviewer_notes, created_at")
                .eq("driver_profile_id", driver.id),
              supabaseAdmin.auth.admin.getUserById(driver.user_id).catch(() => ({ data: { user: null } })),
            ]);

            const documents = await Promise.all(
              (docs ?? []).map(async (doc) => ({
                ...doc,
                signed_url: doc.file_url ? await signedDocUrl(doc.file_url) : null,
              })),
            );

            return {
              ...driver,
              profile,
              email: authUser.data.user?.email ?? null,
              documents,
            };
          }),
        );

        return Response.json({ drivers: items });
      },

      POST: async ({ request }) => {
        const auth = await requireAdmin(request);
        if (auth instanceof Response) return auth;

        const body = (await request.json()) as {
          driverId?: string;
          action?: "approve" | "reject";
          reason?: string;
        };

        if (!body.driverId || !body.action) {
          return Response.json({ error: "driverId and action required" }, { status: 400 });
        }
        if (body.action === "reject" && !body.reason?.trim()) {
          return Response.json({ error: "Rejection reason required" }, { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { notifyUser } = await import("@/server/comms");

        const { data: driver, error: fetchErr } = await supabaseAdmin
          .from("driver_profiles")
          .select("id, user_id, verification_status")
          .eq("id", body.driverId)
          .maybeSingle();

        if (fetchErr) return Response.json({ error: fetchErr.message }, { status: 500 });
        if (!driver) return Response.json({ error: "Driver not found" }, { status: 404 });

        const now = new Date().toISOString();
        const approved = body.action === "approve";

        const { error: updateErr } = await supabaseAdmin
          .from("driver_profiles")
          .update({
            verification_status: approved ? "approved" : "rejected",
            verified_at: approved ? now : null,
            rejection_reason: approved ? null : body.reason?.trim() ?? null,
            updated_at: now,
          })
          .eq("id", driver.id);

        if (updateErr) return Response.json({ error: updateErr.message }, { status: 500 });

        await supabaseAdmin
          .from("driver_documents")
          .update({
            status: approved ? "approved" : "rejected",
            reviewer_notes: approved ? "Approved by admin" : body.reason?.trim() ?? null,
            updated_at: now,
          })
          .eq("driver_profile_id", driver.id);

        if (approved) {
          const { data: existingRole } = await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", driver.user_id)
            .eq("role", "transport")
            .maybeSingle();

          if (!existingRole) {
            await supabaseAdmin.from("user_roles").insert({
              user_id: driver.user_id,
              role: "transport",
            });
          }
        }

        await supabaseAdmin.from("audit_log").insert({
          actor_id: auth.userId,
          action: approved ? "driver_approved" : "driver_rejected",
          entity_type: "driver_profile",
          entity_id: driver.id,
          metadata: { user_id: driver.user_id, reason: body.reason ?? null },
        });

        await notifyUser(driver.user_id, {
          type: approved ? "driver_approved" : "driver_rejected",
          title: approved ? "Driver application approved" : "Driver application not approved",
          body: approved
            ? "You're verified — go online in the transport app to accept delivery jobs."
            : body.reason?.trim() ?? "Please review your documents and reapply.",
          link: approved ? "/app/transport" : "/app/transport/register",
        });

        return Response.json({ ok: true, verification_status: approved ? "approved" : "rejected" });
      },
    },
  },
});
