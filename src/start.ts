import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const rateLimitMiddleware = createMiddleware().server(async ({ request, next }) => {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) return next();

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = `${ip}:${url.pathname}`;
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = url.pathname.includes("webhook") ? 100 : 30;

  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
  } else {
    entry.count += 1;
    if (entry.count > maxRequests) {
      return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
    }
  }

  return next();
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [rateLimitMiddleware, errorMiddleware],
}));
