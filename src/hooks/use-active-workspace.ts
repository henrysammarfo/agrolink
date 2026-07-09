import { useCallback, useEffect, useState } from "react";
import type { AppRole } from "@/lib/auth";
import { loadActiveWorkspace, saveActiveWorkspace } from "@/lib/active-workspace";

/** Reactive active workspace for multi-role users. */
export function useActiveWorkspace(userId: string | undefined, roles: AppRole[]) {
  const [active, setActive] = useState<AppRole>(() =>
    userId ? loadActiveWorkspace(userId, roles) : "buyer",
  );

  useEffect(() => {
    if (!userId) return;
    setActive(loadActiveWorkspace(userId, roles));
  }, [userId, roles.join(",")]);

  const setWorkspace = useCallback(
    (role: AppRole) => {
      if (!userId) return;
      saveActiveWorkspace(userId, role);
      setActive(role);
    },
    [userId],
  );

  return { active, setWorkspace };
}
