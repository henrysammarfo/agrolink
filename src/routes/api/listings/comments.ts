import { createFileRoute } from "@tanstack/react-router";
import { requireAuth, jsonError } from "@/server/api-auth";
import { moderateCommentContent } from "@/server/ai";

type PostBody = {
  listingId?: string;
  content?: string;
};

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

      POST: async ({ request }) => {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        let body: PostBody;
        try {
          body = (await request.json()) as PostBody;
        } catch {
          return jsonError("Invalid JSON", 400);
        }

        const listingId = body.listingId?.trim();
        const content = body.content?.trim() ?? "";
        if (!listingId) return jsonError("Missing listingId", 400);

        const mod = await moderateCommentContent(content);
        if (!mod.passed) {
          return Response.json({ error: mod.reason ?? "Comment rejected", moderated: true }, { status: 422 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("listing_comments")
          .insert({
            listing_id: listingId,
            user_id: auth.userId,
            content: content.slice(0, 1000),
          })
          .select("id, user_id, content, created_at")
          .single();

        if (error) {
          return Response.json({ error: error.message }, { status: 400 });
        }

        return Response.json({ ok: true, comment: data });
      },
    },
  },
});
