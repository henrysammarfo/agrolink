import { useRouterState } from "@tanstack/react-router";
import { useAuth, type AppRole } from "@/lib/auth";
import { loadActiveWorkspace, normalizeWorkspace } from "@/lib/active-workspace";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";

const SHARED_PREFIXES = ["/app/inbox", "/app/profile", "/app/settings", "/app/users", "/app/create"];

/** Shell role for nav chrome — keeps transport/admin isolated on shared pages. */
export function useShellRole(): AppRole {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, roles } = useAuth();
  const { active } = useActiveWorkspace(user?.id, roles);
  const workspace = normalizeWorkspace(
    user?.id ? loadActiveWorkspace(user.id, roles) : active,
  );

  if (pathname.startsWith("/app/admin")) return "admin";
  if (pathname.startsWith("/app/transport")) return "transport";
  if (
    pathname.startsWith("/app/buyer") ||
    pathname.startsWith("/app/farmer") ||
    pathname.startsWith("/app/create")
  ) {
    return "buyer";
  }

  if (SHARED_PREFIXES.some((p) => pathname.startsWith(p))) {
    return "buyer";
  }

  return workspace;
}
