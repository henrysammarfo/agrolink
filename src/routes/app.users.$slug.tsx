import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { FarmerProfileView } from "@/components/farmer/FarmerProfileView";
import { useAuth } from "@/lib/auth";
import { useShellRole } from "@/hooks/use-shell-role";

export const Route = createFileRoute("/app/users/$slug")({
  head: () => ({ meta: [{ title: "Profile · AgroLink" }] }),
  component: InAppUserProfile,
});

function InAppUserProfile() {
  const { slug } = Route.useParams();
  const shellRole = useShellRole();

  return (
    <AppShell role={shellRole}>
      <FarmerProfileView slug={slug} inApp />
    </AppShell>
  );
}
