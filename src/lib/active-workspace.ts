import type { AppRole } from "@/lib/auth";

const KEY = "agrolink:active-workspace:v1";

/** Market mode uses buyer shell; farmer is a capability inside market. */
export function normalizeWorkspace(role: AppRole): AppRole {
  if (role === "farmer") return "buyer";
  return role;
}

export function roleHome(role: AppRole): string {
  const r = normalizeWorkspace(role);
  if (r === "transport") return "/app/transport";
  if (r === "admin") return "/app/admin";
  return "/app/buyer/feed";
}

export function loadActiveWorkspace(userId: string, roles: AppRole[]): AppRole {
  if (typeof window === "undefined") return resolveFromRoles(roles);
  try {
    const raw = localStorage.getItem(KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, AppRole>) : {};
    const saved = all[userId];
    if (saved) {
      const normalized = normalizeWorkspace(saved);
      if (normalized === "buyer" && (roles.includes("buyer") || roles.includes("farmer"))) {
        return "buyer";
      }
      if (normalized === "transport" && roles.includes("transport")) return "transport";
      if (normalized === "admin" && roles.includes("admin")) return "admin";
    }
  } catch {
    // ignore
  }
  return resolveFromRoles(roles);
}

export function saveActiveWorkspace(userId: string, role: AppRole) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, AppRole>) : {};
    all[userId] = role;
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

function resolveFromRoles(roles: AppRole[]): AppRole {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("transport")) return "transport";
  return "buyer";
}
