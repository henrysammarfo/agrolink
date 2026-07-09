import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { FeedPlayer } from "@/components/market/FeedPlayer";

export const Route = createFileRoute("/app/buyer/feed")({
  head: () => ({ meta: [{ title: "Feed · AgroLink" }] }),
  component: Feed,
});

function Feed() {
  return (
    <AppShell role="buyer">
      <FeedPlayer fullscreen inAppFeed />
    </AppShell>
  );
}
