/**
 * Authenticated fetch — attaches Supabase session JWT to API routes.
 */
import { supabase } from "@/integrations/supabase/client";

export async function getAuthHeaders(
  extra?: Record<string, string>,
): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers: Record<string, string> = { ...extra };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const headers = await getAuthHeaders(
    init?.headers
      ? Object.fromEntries(new Headers(init.headers as HeadersInit).entries())
      : undefined,
  );
  if (init?.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  return fetch(input, { ...init, headers });
}
