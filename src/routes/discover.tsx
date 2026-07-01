import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Info, ShoppingBasket } from "lucide-react";
import { FeedPlayer, FEED_ALGORITHM_COPY } from "@/components/market/FeedPlayer";

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
      <Link
        to="/auth"
        className="absolute right-4 top-[max(env(safe-area-inset-top),12px)] z-20 hidden items-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-lg hover:brightness-110 sm:inline-flex"
      >
        <ShoppingBasket className="h-3.5 w-3.5" /> Start buying
      </Link>
      <div className="pointer-events-none absolute inset-x-4 bottom-[max(env(safe-area-inset-bottom),16px)] z-20 rounded-2xl bg-black/30 p-3 text-[11px] text-white/85 backdrop-blur sm:left-auto sm:right-4 sm:top-16 sm:bottom-auto sm:max-w-[280px]">
        <div className="mb-1 inline-flex items-center gap-1 font-medium text-white"><Info className="h-3.5 w-3.5" /> Feed algorithm</div>
        {FEED_ALGORITHM_COPY}
      </div>
    </div>
  );
}