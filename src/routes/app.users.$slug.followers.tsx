import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { fetchFollowersList } from "@/lib/api/engagement";
import { fetchListingsBySlug } from "@/lib/api/listings";
import { SocialUserList } from "@/components/social/SocialUserList";
import { useAuth } from "@/lib/auth";
import { useShellRole } from "@/hooks/use-shell-role";
import { isOwnProfileHandle } from "@/lib/profile-links";

export const Route = createFileRoute("/app/users/$slug/followers")({
  head: () => ({ meta: [{ title: "Followers · AgroLink" }] }),
  component: UserFollowers,
});

function UserFollowers() {
  const { slug } = Route.useParams();
  const { profile, user } = useAuth();
  const shellRole = useShellRole();

  if (isOwnProfileHandle(slug, profile, user?.id)) {
    throw redirect({ to: "/app/profile/followers" });
  }

  const { data: profileData } = useQuery({
    queryKey: ["farmer-profile", slug],
    queryFn: () => fetchListingsBySlug(slug),
  });

  const name = (profileData?.profile as { display_name?: string })?.display_name ?? "User";

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["followers", slug],
    queryFn: () => fetchFollowersList(slug),
  });

  return (
    <AppShell role={shellRole}>
      <div className="mx-auto w-full max-w-lg">
        <Link
          to="/app/users/$slug"
          params={{ slug }}
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {name}
        </Link>
        <PageHeader eyebrow="Social" title={`${name}'s`} italic="followers" />
        <SocialUserList users={users} loading={isLoading} emptyLabel="No followers yet." inApp />
      </div>
    </AppShell>
  );
}
