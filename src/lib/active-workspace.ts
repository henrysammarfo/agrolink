import type { AppRole } from "@/lib/auth";

const KEY = "agrolink:active-workspace:v1";

export function roleHome(role: AppRole): string {
  if (role === "farmer") return "/app/farmer";
  if (role === "transport") return "/app/transport";
  if (role === "admin") return "/app/admin";
  return "/app/buyer";
}

export function loadActiveWorkspace(userId: string, roles: AppRole[]): AppRole {
  if (typeof window === "undefined") return resolveFromRoles(roles);
  try {
    const raw = localStorage.getItem(KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, AppRole>) : {};
    const saved = all[userId];
    if (saved && roles.includes(saved)) return saved;
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
  if (roles.includes("farmer")) return "farmer";
  if (roles.includes("transport")) return "transport";
  return "buyer";
}
