import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth, type AppRole } from "@/lib/auth";
import { roleHome, saveActiveWorkspace } from "@/lib/active-workspace";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";

/** Enable Shop / Sell / Drive capability on the account. */
export function useEnableWorkspace() {
  const navigate = useNavigate();
  const { user, roles, addRole } = useAuth();
  const { setWorkspace } = useActiveWorkspace(user?.id, roles);

  const enableRole = useCallback(
    async (next: Exclude<AppRole, "admin">) => {
      await addRole(next);
      if (user?.id) {
        // Sell is a Studio capability under Market workspace, not its own dashboard
        const workspace = next === "farmer" ? "buyer" : next;
        setWorkspace(workspace);
        saveActiveWorkspace(user.id, workspace);
      }
      toast.success(`${next === "transport" ? "Drive" : next === "farmer" ? "Sell" : "Shop"} mode enabled`);
      if (next === "transport") navigate({ to: "/app/transport/register" });
      else if (next === "farmer") navigate({ to: "/app/create" });
      else navigate({ to: roleHome(next) as "/app/buyer/feed" });
    },
    [addRole, user?.id, setWorkspace, navigate],
  );

  return { enableRole };
}
