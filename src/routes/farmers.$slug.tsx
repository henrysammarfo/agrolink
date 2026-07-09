import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { FarmerProfileView } from "@/components/farmer/FarmerProfileView";

export const Route = createFileRoute("/farmers/$slug")({
  head: () => ({
    meta: [{ title: "Farmer profile · AgroLink" }],
  }),
  component: FarmerProfile,
});

function FarmerProfile() {
  const { slug } = Route.useParams();

  return (
    <SiteLayout>
      <FarmerProfileView slug={slug} inApp={false} />
    </SiteLayout>
  );
}
