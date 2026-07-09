import type { AppRole } from "@/lib/auth";

/** Pick the best AppShell role from the user's enabled roles. */
export function resolveAppRole(roles: AppRole[]): AppRole {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("farmer")) return "farmer";
  if (roles.includes("transport")) return "transport";
  return "buyer";
}

export function profilePath(handle: string, inApp = true): "/app/users/$slug" | "/farmers/$slug" {
  return inApp ? "/app/users/$slug" : "/farmers/$slug";
}
