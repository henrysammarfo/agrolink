import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { FarmerProfileView } from "@/components/farmer/FarmerProfileView";
import { useAuth } from "@/lib/auth";
import { useShellRole } from "@/hooks/use-shell-role";
import { isOwnProfileHandle } from "@/lib/profile-links";

export const Route = createFileRoute("/app/users/$slug")({
  head: () => ({ meta: [{ title: "Profile · AgroLink" }] }),
  component: InAppUserProfile,
});

function InAppUserProfile() {
  const { slug } = Route.useParams();
  const { profile, user } = useAuth();
  const shellRole = useShellRole();

  if (isOwnProfileHandle(slug, profile, user?.id)) {
    throw redirect({ to: "/app/profile" });
  }

  return (
    <AppShell role={shellRole}>
      <FarmerProfileView slug={slug} inApp />
    </AppShell>
  );
}
