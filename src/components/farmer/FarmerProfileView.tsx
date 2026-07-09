import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ArrowLeft, BadgeCheck, MapPin, MessageCircle, Share2, UserPlus, UserCheck, Grid3x3, Play, Loader2, Bookmark, Truck,
} from "lucide-react";
import { toast } from "sonner";
import { fetchListingsBySlug } from "@/lib/api/listings";
import { fetchProfileStats, fetchPublicBookmarks, fetchPublicDriverInfo, fetchDriverDeliveryCount } from "@/lib/api/profiles";
import { toggleFollow, fetchIsFollowing } from "@/lib/api/engagement";
import { trackProfileView } from "@/lib/api/profile-views";
import { fetchRequestStatus } from "@/lib/api/message-requests";
import { sendChatMessage } from "@/lib/api/chat";
import { useAuth } from "@/lib/auth";
import { MARKETING_FALLBACK_IMAGE } from "@/lib/config/site";
import { profilePath } from "@/lib/app-role";

type Props = {
  slug: string;
  inApp?: boolean;
};

export function FarmerProfileView({ slug, inApp = false }: Props) {
  const navigate = useNavigate();
  const { user, profile: authProfile } = useAuth();
  const qc = useQueryClient();
  const farmerSlug = slug.trim().toLowerCase();
  const [tab, setTab] = useState<"posts" | "bookmarks">("posts");
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["farmer-profile", slug],
    queryFn: () => fetchListingsBySlug(slug),
  });

  const farmerProfile = data?.profile as {
    id?: string;
    display_name?: string;
    avatar_url?: string;
    bio?: string;
    region?: string;
    username?: string;
    slug?: string;
    follower_count?: number;
    seller_rating?: number;
    verified?: boolean;
  } | undefined;

  const followKey = (farmerProfile?.slug ?? farmerSlug).trim().toLowerCase();
  const publicHandle = farmerProfile?.username ?? farmerProfile?.slug ?? slug;

  const { data: stats } = useQuery({
    queryKey: ["farmer-stats", farmerProfile?.id, farmerSlug],
    queryFn: () => fetchProfileStats(farmerProfile!.id!, followKey),
    enabled: !!farmerProfile?.id,
  });

  const { data: isFollowing = false } = useQuery({
    queryKey: ["following", user?.id, followKey],
    queryFn: () => fetchIsFollowing(user!.id, followKey),
    enabled: !!user?.id && !!followKey,
  });

  const { data: publicBookmarks = [] } = useQuery({
    queryKey: ["public-bookmarks", farmerProfile?.id],
    queryFn: () => fetchPublicBookmarks(farmerProfile!.id!),
    enabled: !!farmerProfile?.id,
  });

  const { data: requestStatus } = useQuery({
    queryKey: ["message-request-status", user?.id, farmerProfile?.id],
    queryFn: () => fetchRequestStatus(user!.id, farmerProfile!.id!),
    enabled: !!user?.id && !!farmerProfile?.id && user.id !== farmerProfile.id,
  });

  useEffect(() => {
    if (!farmerProfile?.id || !user?.id || user.id === farmerProfile.id) return;
    void trackProfileView(farmerProfile.id);
  }, [farmerProfile?.id, user?.id]);

  const handleShare = async () => {
    const url = `${location.origin}/farmers/${publicHandle}`;
    try {
      if (navigator.share) await navigator.share({ title: farmerProfile?.display_name ?? "Farmer", url });
      else await navigator.clipboard.writeText(url);
      toast.success("Profile link copied");
    } catch {
      toast.error("Share cancelled");
    }
  };

  const openChat = () => {
    if (!user?.id || !farmerProfile?.id) {
      toast.error("Sign in to message");
      return;
    }
    if (requestStatus === "pending") {
      toast.info("Message request pending — waiting for them to accept");
      return;
    }
    if (requestStatus === "accepted" || isFollowing) {
      navigate({ to: "/app/inbox/chat/$userId", params: { userId: farmerProfile.id } });
      return;
    }
    setMessageOpen(true);
  };

  const sendMessageRequest = async () => {
    if (!user?.id || !farmerProfile?.id) return;
    const text = messageText.trim() || "Hi! I'd like to connect on AgroLink.";
    setSendingRequest(true);
    try {
      const result = await sendChatMessage({
        senderId: user.id,
        receiverId: farmerProfile.id,
        content: text,
        senderName: authProfile?.display_name ?? "Someone",
      });
      setMessageOpen(false);
      setMessageText("");
      if (result === "pending") {
        toast.success("Message request sent", { description: "They can accept in their inbox." });
        await qc.invalidateQueries({ queryKey: ["message-request-status", user.id, farmerProfile.id] });
      } else {
        toast.success("Message sent");
        navigate({ to: "/app/inbox/chat/$userId", params: { userId: farmerProfile.id } });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send request");
    } finally {
      setSendingRequest(false);
    }
  };

  const onFollow = async () => {
    if (!user?.id) {
      toast.error("Sign in to follow");
      return;
    }
    if (user.id === farmerProfile?.id) return;
    try {
      await toggleFollow(user.id, followKey, !isFollowing, authProfile?.display_name ?? undefined);
      await qc.invalidateQueries({ queryKey: ["following", user.id, followKey] });
      await qc.invalidateQueries({ queryKey: ["farmer-stats", farmerProfile?.id, followKey] });
      toast.success(isFollowing ? "Unfollowed" : "Following");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update follow");
    }
  };

  const listings = data?.listings ?? [];

  const { data: driverInfo } = useQuery({
    queryKey: ["driver-public", farmerProfile?.id],
    queryFn: () => fetchPublicDriverInfo(farmerProfile!.id!),
    enabled: !!farmerProfile?.id,
  });

  const { data: driverTrips = 0 } = useQuery({
    queryKey: ["driver-trips", farmerProfile?.id],
    queryFn: () => fetchDriverDeliveryCount(farmerProfile!.id!),
    enabled: !!farmerProfile?.id && driverInfo?.verification_status === "approved",
  });

  const isDriver = driverInfo?.verification_status === "approved";
  const isFarmer = listings.length > 0;
  const handle = farmerProfile?.username ?? (farmerProfile?.slug ?? slug).replace(/-/g, "");
  const isSelf = user?.id === farmerProfile?.id;
  const followersLink = inApp
    ? { to: "/app/users/$slug/followers" as const, params: { slug: publicHandle } }
    : { to: "/farmers/$slug/followers" as const, params: { slug } };

  if (isLoading) {
    return (
      <div className="grid place-items-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !farmerProfile?.id) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-32 text-center">
        <h1 className="font-serif text-3xl sm:text-5xl text-foreground">Profile not found</h1>
        <Link
          to={inApp ? "/app/buyer/feed" : "/farmers"}
          className="mt-6 inline-flex items-center gap-2 text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> {inApp ? "Back to feed" : "All farmers"}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-0 sm:px-2 pb-8">
      <div className="flex items-center justify-between gap-3 px-1">
        <Link
          to={inApp ? "/app/buyer/feed" : "/farmers"}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {inApp ? "Back to feed" : "All farmers"}
        </Link>
      </div>

      <div className="mt-4 flex flex-col items-center sm:flex-row sm:items-end sm:gap-6 px-2 sm:px-4">
        <div className="relative">
          {farmerProfile.avatar_url ? (
            <img src={farmerProfile.avatar_url} alt={farmerProfile.display_name ?? ""} className="h-24 w-24 sm:h-32 sm:w-32 rounded-full object-cover ring-4 ring-background shadow-lg" />
          ) : (
            <span className="grid h-24 w-24 sm:h-32 sm:w-32 place-items-center rounded-full bg-card font-serif text-4xl ring-4 ring-background">
              {(farmerProfile.display_name ?? "F")[0]}
            </span>
          )}
          {farmerProfile.verified && (
            <span className="absolute bottom-1 right-1 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground ring-2 ring-background">
              <BadgeCheck className="h-4 w-4" />
            </span>
          )}
        </div>
          <div className="mt-4 sm:mt-0 flex-1 text-center sm:text-left">
            <h1 className="font-serif text-2xl sm:text-4xl text-foreground">{farmerProfile.display_name}</h1>
            <p className="text-sm text-muted-foreground">@{handle}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {isDriver && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  <Truck className="h-3 w-3" /> Driver
                </span>
              )}
              {isFarmer && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-primary">
                  Seller
                </span>
              )}
              {driverInfo?.available && (
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                  Online now
                </span>
              )}
            </div>
            <p className="mt-1 inline-flex items-center justify-center sm:justify-start gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {farmerProfile.region ?? "Greater Accra"}
              {isDriver && driverInfo?.vehicle_type && (
                <span>· {driverInfo.vehicle_type}{driverInfo.plate_number ? ` · ${driverInfo.plate_number}` : ""}</span>
              )}
            </p>
          </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap items-center justify-center gap-2">
          {!isSelf && (
            <button
              onClick={onFollow}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition ${
                isFollowing ? "border border-border text-foreground hover:bg-secondary" : "bg-foreground text-background hover:bg-foreground/90"
              }`}
            >
              {isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
          {!isSelf && (
            <button
              onClick={openChat}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm hover:bg-secondary"
            >
              <MessageCircle className="h-4 w-4" />
              {requestStatus === "pending" ? "Request sent" : requestStatus === "accepted" ? "Message" : "Request message"}
            </button>
          )}
          <button
            onClick={handleShare}
            className="grid h-10 w-10 place-items-center rounded-full border border-border hover:bg-secondary"
            aria-label="Share"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center sm:justify-start gap-8 sm:gap-10 text-center px-2">
        <Link {...followersLink} className="hover:opacity-80">
          <Stat n={String(stats?.followers ?? farmerProfile.follower_count ?? 0)} label="Followers" />
        </Link>
        {isFarmer ? (
          <Stat n={String(stats?.listingCount ?? listings.length)} label="Listings" />
        ) : isDriver ? (
          <Stat n={String(driverTrips)} label="Trips" />
        ) : null}
        {isFarmer && <Stat n={String(stats?.completedTrades ?? 0)} label="Trades" />}
        {isFarmer && (
          <Stat n={farmerProfile.seller_rating != null ? `${farmerProfile.seller_rating.toFixed(1)}★` : "—"} label="Rating" />
        )}
      </div>

      <p className="mt-5 px-2 text-center sm:text-left text-foreground/85 max-w-2xl text-sm sm:text-base">
        {farmerProfile.bio ?? (isDriver ? "AgroLink verified driver on the corridor." : "Fresh produce from Greater Accra.")}
      </p>

      {(isFarmer || publicBookmarks.length > 0) && (
        <div className="mt-8 border-b border-border px-2">
          <div className="flex items-center justify-center gap-8 text-sm">
            <button
              type="button"
              onClick={() => setTab("posts")}
              className={`flex items-center gap-2 border-b-2 px-2 pb-3 transition ${tab === "posts" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"}`}
            >
              <Grid3x3 className="h-4 w-4" /> Posts
            </button>
            {publicBookmarks.length > 0 && (
              <button
                type="button"
                onClick={() => setTab("bookmarks")}
                className={`flex items-center gap-2 border-b-2 px-2 pb-3 transition ${tab === "bookmarks" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"}`}
              >
                <Bookmark className="h-4 w-4" /> Saved
              </button>
            )}
          </div>
        </div>
      )}

      {(isFarmer || publicBookmarks.length > 0) ? (
      <div className="mt-4 grid grid-cols-3 gap-0.5 sm:gap-1">
        {(tab === "posts" ? listings : publicBookmarks).map((l) => (
          <Link
            key={l.id}
            to="/app/buyer/feed"
            className="group relative aspect-[9/16] overflow-hidden bg-muted"
          >
            <img
              src={l.image_url ?? MARKETING_FALLBACK_IMAGE}
              alt={l.title}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded bg-black/50 px-1.5 py-0.5 text-[9px] text-white">
              <Play className="h-2.5 w-2.5 fill-current" /> {l.view_count}
            </span>
          </Link>
        ))}
        {(tab === "posts" ? listings : publicBookmarks).length === 0 && (
          <div className="col-span-3 py-16 text-center text-sm text-muted-foreground">
            {tab === "posts" ? "No posts yet." : "No public saves yet."}
          </div>
        )}
      </div>
      ) : isDriver ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Follow this driver to get updates when they are online for deliveries.
        </div>
      ) : null}

      {messageOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-3 sm:p-4" onClick={() => setMessageOpen(false)}>
          <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-xl">Request to message</h3>
            <p className="mt-1 text-xs text-muted-foreground">Introduce yourself — they can accept in their inbox.</p>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={3}
              placeholder="Hi! I'm interested in your produce…"
              className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setMessageOpen(false)} className="flex-1 rounded-full border border-border py-2.5 text-sm">
                Cancel
              </button>
              <button
                type="button"
                onClick={sendMessageRequest}
                disabled={sendingRequest}
                className="flex-1 rounded-full bg-primary py-2.5 text-sm text-primary-foreground disabled:opacity-50"
              >
                {sendingRequest ? "Sending…" : "Send request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="font-serif text-lg sm:text-xl text-foreground">{n}</div>
      <div className="text-[10px] sm:text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

export { profilePath };
