/**
 * Verify Supabase JWT on API routes — never trust userId from request body.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AuthContext = { userId: string; token: string; email?: string | null };

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (isNewSupabaseApiKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function supabaseEnv() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token || token.split(".").length !== 3) return null;
  return token;
}

/** Returns authenticated user id from JWT, or null if missing/invalid. */
export async function authenticateRequest(request: Request): Promise<AuthContext | null> {
  const env = supabaseEnv();
  const token = getBearerToken(request);
  if (!env || !token) return null;

  const supabase = createClient<Database>(env.url, env.key, {
    global: {
      fetch: createSupabaseFetch(env.key),
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.id) return null;
  return { userId: data.user.id, token, email: data.user.email };
}

/** Require valid JWT — returns Response on failure. */
export async function requireAuth(request: Request): Promise<AuthContext | Response> {
  const auth = await authenticateRequest(request);
  if (!auth) return jsonError("Unauthorized", 401);
  return auth;
}

/** Optional JWT — for public routes that enrich data when logged in. */
export async function optionalAuth(request: Request): Promise<AuthContext | null> {
  return authenticateRequest(request);
}

export async function userHasRole(userId: string, role: string): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", role)
    .maybeSingle();
  return !!data;
}

export async function requireAdmin(request: Request): Promise<AuthContext | Response> {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const isAdmin = await userHasRole(auth.userId, "admin");
  if (!isAdmin) return jsonError("Forbidden: admin only", 403);
  return auth;
}

export async function requireRole(
  request: Request,
  role: string,
): Promise<AuthContext | Response> {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const ok = await userHasRole(auth.userId, role);
  if (!ok) return jsonError(`Forbidden: ${role} role required`, 403);
  return auth;
}

/** Vercel cron / internal jobs — Authorization: Bearer CRON_SECRET */
export function requireCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const token = getBearerToken(request);
  return token === secret;
}

/** Escape user input for PostgREST ilike patterns. */
export function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}
