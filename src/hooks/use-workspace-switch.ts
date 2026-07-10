import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth, type AppRole } from "@/lib/auth";
import { useDriverProfile } from "@/hooks/use-marketplace";
import { isDriverVerified } from "@/lib/api/driver-onboarding";
import { roleHome, normalizeWorkspace } from "@/lib/active-workspace";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";

/** Single code path for Market / Drive / Admin switches (sidebar + settings). */
export function useWorkspaceSwitch() {
  const navigate = useNavigate();
  const { user, roles, hasRole } = useAuth();
  const { active, setWorkspace } = useActiveWorkspace(user?.id, roles);
  const { data: driverProfile } = useDriverProfile(user?.id);

  const switchTo = useCallback(
    (role: AppRole) => {
      if (role === "buyer" && !hasRole("buyer") && !hasRole("farmer")) {
        toast.error("Enable Market workspace in Settings first");
        navigate({ to: "/app/settings" });
        return;
      }
      if (role !== "buyer" && !hasRole(role)) {
        toast.error("Enable this workspace in Settings first");
        navigate({ to: "/app/settings" });
        return;
      }
      if (user?.id) setWorkspace(role);
      if (role === "transport") {
        navigate({
          to: isDriverVerified(driverProfile ?? null) ? "/app/transport" : "/app/transport/register",
        });
        return;
      }
      navigate({ to: roleHome(role) as "/app/buyer" });
    },
    [user?.id, hasRole, setWorkspace, navigate, driverProfile],
  );

  return { active, activeNorm: normalizeWorkspace(active), switchTo };
}
