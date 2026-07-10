import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import { useShellRole } from "@/hooks/use-shell-role";
import { fetchFollowersList } from "@/lib/api/engagement";
import { SocialUserList } from "@/components/social/SocialUserList";

export const Route = createFileRoute("/app/profile/followers")({
  head: () => ({ meta: [{ title: "Followers · AgroLink" }] }),
  component: FollowersPage,
});

function FollowersPage() {
  const { user, profile } = useAuth();
  const shellRole = useShellRole();
  const handle = profile?.slug ?? profile?.username ?? user?.id ?? "";

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["followers", handle],
    queryFn: () => fetchFollowersList(handle),
    enabled: !!handle,
  });

  return (
    <AppShell role={shellRole} compact>
      <Link to="/app/profile" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Profile
      </Link>
      <PageHeader eyebrow="Social" title="Your" italic="followers" sub="People who follow your profile." />
      <SocialUserList users={users} loading={isLoading} emptyLabel="No followers yet. Post listings and share your profile link." inApp />
    </AppShell>
  );
}
