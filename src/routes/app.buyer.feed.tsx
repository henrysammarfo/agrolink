import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { FeedPlayer } from "@/components/market/FeedPlayer";

export const Route = createFileRoute("/app/buyer/feed")({
  validateSearch: (search: Record<string, unknown>): { listing?: string } => ({
    listing: typeof search.listing === "string" && search.listing ? search.listing : undefined,
  }),
  head: () => ({ meta: [{ title: "Feed · AgroLink" }] }),
  component: Feed,
});

function Feed() {
  const { listing } = Route.useSearch();

  return (
    <AppShell role="buyer">
      <FeedPlayer fullscreen inAppFeed chrome="app" listingId={listing} />
    </AppShell>
  );
}
