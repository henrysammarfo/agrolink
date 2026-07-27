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
      <FeedPlayer fullscreen chrome="public" />
      {/* Mobile-only back chip — desktop uses left TikTok rail */}
      <Link
        to="/"
        className="absolute left-4 top-[max(env(safe-area-inset-top),12px)] z-20 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black shadow-lg ring-2 ring-white/40 backdrop-blur-sm lg:hidden"
      >
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>
    </div>
  );
}
