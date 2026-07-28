import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { FeedPlayer } from "@/components/market/FeedPlayer";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/market")({
  validateSearch: (search: Record<string, unknown>): { listing?: string } => ({
    listing: typeof search.listing === "string" && search.listing ? search.listing : undefined,
  }),
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
  const { user, loading } = useAuth();
  const { listing } = Route.useSearch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      void navigate({
        to: "/app/buyer/feed",
        search: listing ? { listing } : {},
        replace: true,
      });
    }
  }, [loading, user, listing, navigate]);

  if (loading || user) {
    return (
      <div className="grid h-screen w-screen place-items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <FeedPlayer fullscreen chrome="public" listingId={listing} />
      <Link
        to="/"
        className="absolute left-4 top-[max(env(safe-area-inset-top),12px)] z-20 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black shadow-lg ring-2 ring-white/40 backdrop-blur-sm lg:hidden"
      >
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>
    </div>
  );
}
