import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { fetchFollowersList } from "@/lib/api/engagement";
import { fetchListingsBySlug } from "@/lib/api/listings";
import { SocialUserList } from "@/components/social/SocialUserList";

export const Route = createFileRoute("/farmers/$slug/followers")({
  head: () => ({ meta: [{ title: "Followers · AgroLink" }] }),
  component: FarmerFollowers,
});

function FarmerFollowers() {
  const { slug } = Route.useParams();

  const { data: profileData } = useQuery({
    queryKey: ["farmer-profile", slug],
    queryFn: () => fetchListingsBySlug(slug),
  });

  const name = (profileData?.profile as { display_name?: string })?.display_name ?? "Farmer";

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["followers", slug],
    queryFn: () => fetchFollowersList(slug),
  });

  return (
    <SiteLayout>
      <div className="mx-auto max-w-lg px-4 py-8">
        <Link to="/farmers/$slug" params={{ slug }} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {name}
        </Link>
        <h1 className="mt-4 font-serif text-3xl">Followers</h1>
        <div className="mt-6">
          <SocialUserList users={users} loading={isLoading} emptyLabel="No followers yet." />
        </div>
      </div>
    </SiteLayout>
  );
}
