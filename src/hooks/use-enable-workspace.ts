import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth, type AppRole } from "@/lib/auth";
import { roleHome, saveActiveWorkspace } from "@/lib/active-workspace";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";

/** Enable Shop / Sell / Drive workspace on the account. */
export function useEnableWorkspace() {
  const navigate = useNavigate();
  const { user, roles, addRole } = useAuth();
  const { setWorkspace } = useActiveWorkspace(user?.id, roles);

  const enableRole = useCallback(
    async (next: Exclude<AppRole, "admin">) => {
      await addRole(next);
      if (user?.id) {
        setWorkspace(next);
        saveActiveWorkspace(user.id, next);
      }
      toast.success(`${next === "transport" ? "Drive" : next === "farmer" ? "Sell" : "Shop"} mode enabled`);
      if (next === "transport") navigate({ to: "/app/transport/register" });
      else navigate({ to: roleHome(next) as "/app/buyer" });
    },
    [addRole, user?.id, setWorkspace, navigate],
  );

  return { enableRole };
}
