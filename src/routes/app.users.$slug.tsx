import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { FarmerProfileView } from "@/components/farmer/FarmerProfileView";
import { useAuth } from "@/lib/auth";
import { resolveAppRole } from "@/lib/app-role";

export const Route = createFileRoute("/app/users/$slug")({
  head: () => ({ meta: [{ title: "Profile · AgroLink" }] }),
  component: InAppUserProfile,
});

function InAppUserProfile() {
  const { slug } = Route.useParams();
  const { roles } = useAuth();

  return (
    <AppShell role={resolveAppRole(roles)}>
      <FarmerProfileView slug={slug} inApp />
    </AppShell>
  );
}
