import { createFileRoute } from "@tanstack/react-router";
import { FeedPlayer } from "@/components/market/FeedPlayer";

export const Route = createFileRoute("/app/buyer/feed")({
  head: () => ({ meta: [{ title: "Feed · AgroLink" }] }),
  component: Feed,
});

function Feed() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <FeedPlayer fullscreen />
    </div>
  );
}
