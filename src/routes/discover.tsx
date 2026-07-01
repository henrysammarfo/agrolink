import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Info } from "lucide-react";
import { FeedPlayer } from "@/components/market/FeedPlayer";

export const Route = createFileRoute("/discover")({
  head: () => ({ meta: [{ title: "Discover · AgroLink" }] }),
  component: Discover,
});

function Discover() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <FeedPlayer fullscreen />
      <Link
        to="/"
        className="absolute left-4 top-[max(env(safe-area-inset-top),12px)] z-20 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-white backdrop-blur hover:bg-white/20"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Home
      </Link>
      <div className="pointer-events-none absolute right-4 top-[max(env(safe-area-inset-top),12px)] z-20 max-w-[220px] rounded-2xl bg-white/10 p-3 text-[11px] text-white/85 backdrop-blur">
        <div className="mb-1 inline-flex items-center gap-1 font-medium text-white"><Info className="h-3.5 w-3.5" /> Feed algorithm</div>
        Freshness + engagement + trust badges + trending boosts. No random ordering.
      </div>
    </div>
  );
}