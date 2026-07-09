import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { fetchFollowersList } from "@/lib/api/engagement";
import { fetchListingsBySlug } from "@/lib/api/listings";
import { SocialUserList } from "@/components/social/SocialUserList";
import { useAuth } from "@/lib/auth";
import { resolveAppRole } from "@/lib/app-role";

export const Route = createFileRoute("/app/users/$slug/followers")({
  head: () => ({ meta: [{ title: "Followers · AgroLink" }] }),
  component: UserFollowers,
});

function UserFollowers() {
  const { slug } = Route.useParams();
  const { roles } = useAuth();

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
    <AppShell role={resolveAppRole(roles)}>
      <div className="mx-auto max-w-lg">
        <Link to="/app/users/$slug" params={{ slug }} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {name}
        </Link>
        <h1 className="mt-4 font-serif text-3xl">Followers</h1>
        <div className="mt-6">
          <SocialUserList users={users} loading={isLoading} emptyLabel="No followers yet." inApp />
        </div>
      </div>
    </AppShell>
  );
}
