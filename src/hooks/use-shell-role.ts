import { useRouterState } from "@tanstack/react-router";
import { useAuth, type AppRole } from "@/lib/auth";
import { loadActiveWorkspace, normalizeWorkspace } from "@/lib/active-workspace";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";

/**
 * Shell role for nav chrome.
 * Route prefixes win for Market / Studio / Drive / Admin so modes stay separate.
 * Shared pages (inbox, profile, settings) keep the active workspace chrome.
 */
export function useShellRole(): AppRole {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, roles } = useAuth();
  const { active } = useActiveWorkspace(user?.id, roles);
  const workspace = normalizeWorkspace(
    user?.id ? loadActiveWorkspace(user.id, roles) : active,
  );

  if (pathname.startsWith("/app/admin")) return "admin";
  if (pathname.startsWith("/app/transport")) return "transport";
  if (pathname.startsWith("/app/farmer") || pathname.startsWith("/app/create")) {
    return roles.includes("farmer") ? "buyer" : workspace;
  }
  if (pathname.startsWith("/app/buyer")) return "buyer";

  if (
    pathname.startsWith("/app/inbox") ||
    pathname.startsWith("/app/profile") ||
    pathname.startsWith("/app/settings") ||
    pathname.startsWith("/app/users")
  ) {
    return workspace;
  }

  return workspace;
}
