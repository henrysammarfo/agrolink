import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { FeedPlayer } from "@/components/market/FeedPlayer";

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { title: "Market · AgroLink" },
      { name: "description", content: "Swipe through fresh produce listings from farms across Greater Accra." },
      { property: "og:title", content: "Market · AgroLink" },
      { property: "og:description", content: "Today's harvest, streaming now." },
    ],
  }),
  component: Market,
});

function Market() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <FeedPlayer fullscreen />
      <Link
        to="/"
        className="absolute left-4 top-[max(env(safe-area-inset-top),12px)] z-20 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-white backdrop-blur hover:bg-white/20"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Home
      </Link>
    </div>
  );
}
