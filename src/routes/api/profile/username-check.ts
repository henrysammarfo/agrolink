import { createFileRoute } from "@tanstack/react-router";
import { optionalAuth } from "@/server/api-auth";

const USERNAME_RE = /^[a-z0-9_]{3,30}$/;

export const Route = createFileRoute("/api/profile/username-check")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const raw = (url.searchParams.get("username") ?? "").trim().toLowerCase();
        if (!USERNAME_RE.test(raw)) {
          return Response.json({
            available: false,
            error: "Use 3–30 characters: letters, numbers, underscore only",
          });
        }

        const auth = await optionalAuth(request);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: existing } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .ilike("username", raw)
          .maybeSingle();

        const taken = !!existing && existing.id !== auth?.userId;
        return Response.json({ available: !taken, username: raw });
      },
    },
  },
});
