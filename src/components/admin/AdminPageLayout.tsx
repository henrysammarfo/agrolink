import type { ReactNode } from "react";
import { AppShell } from "@/components/app/AppShell";
import { AdminGate } from "@/components/app/RoleGate";

/** Shared admin chrome — gate once, shell once. */
export function AdminPageLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGate>
      <AppShell role="admin" compact>
        {children}
      </AppShell>
    </AdminGate>
  );
}
