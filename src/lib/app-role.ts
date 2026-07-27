import type { AppRole } from "@/lib/auth";

/** In-app vs public farmer profile path helper. */
export function profilePath(handle: string, inApp = true): "/app/users/$slug" | "/farmers/$slug" {
  return inApp ? "/app/users/$slug" : "/farmers/$slug";
}

/** Prefer Market shell role; farmer is Studio chrome, not a workspace. */
export function resolveAppRole(roles: AppRole[]): AppRole {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("transport") && !roles.includes("buyer") && !roles.includes("farmer")) {
    return "transport";
  }
  return "buyer";
}
