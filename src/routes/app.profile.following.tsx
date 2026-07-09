import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import { resolveAppRole } from "@/lib/app-role";
import { fetchFollowingList } from "@/lib/api/engagement";
import { SocialUserList } from "@/components/social/SocialUserList";

export const Route = createFileRoute("/app/profile/following")({
  head: () => ({ meta: [{ title: "Following · AgroLink" }] }),
  component: FollowingPage,
});

function FollowingPage() {
  const { user, roles } = useAuth();
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["following", user?.id],
    queryFn: fetchFollowingList,
    enabled: !!user?.id,
  });

  return (
    <AppShell role={resolveAppRole(roles)} compact>
      <Link to="/app/profile" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Profile
      </Link>
      <PageHeader eyebrow="Social" title="People you" italic="follow" sub="Farmers and sellers you follow across the feed." />
      <SocialUserList users={users} loading={isLoading} emptyLabel="You're not following anyone yet. Explore the feed and tap + on avatars." inApp />
    </AppShell>
  );
}
