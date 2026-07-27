import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { FeedPlayer } from "@/components/market/FeedPlayer";

export const Route = createFileRoute("/discover")({
  head: () => ({ meta: [{ title: "Discover · AgroLink" }] }),
  beforeLoad: () => {
    throw redirect({ to: "/market" });
  },
  component: DiscoverFallback,
});

function DiscoverFallback() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <FeedPlayer fullscreen chrome="public" />
      <Link
        to="/"
        className="absolute left-4 top-[max(env(safe-area-inset-top),12px)] z-20 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black shadow-lg lg:hidden"
      >
        <ArrowLeft className="h-4 w-4" /> Home
      </Link>
    </div>
  );
}
