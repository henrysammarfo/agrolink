import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, MessageCircle, Truck, Wallet, Bell, Loader2, UserPlus, Check, X, Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { ConversationList } from "@/components/chat/ConversationList";
import { useAuth } from "@/lib/auth";
import { useShellRole } from "@/hooks/use-shell-role";
import {
  useNotifications,
  useConversations,
  useUnreadCounts,
} from "@/hooks/use-marketplace";
import {
  markNotificationRead,
  markAllNotificationsRead,
  subscribeToNotifications,
} from "@/lib/api/notifications";
import { showLocalNotification } from "@/lib/push-client";
import {
  fetchMessageRequests,
  fetchOutgoingMessageRequests,
  respondToMessageRequest,
} from "@/lib/api/message-requests";
import { parseNotificationTarget } from "@/lib/profile-links";
import { useQuery } from "@tanstack/react-query";

const ICON_MAP: Record<string, typeof Heart> = {
  like: Heart,
  comment: MessageCircle,
  order_confirmed: Truck,
  delivery: Truck,
  delivery_job: Truck,
  delivery_complete: Truck,
  message: MessageCircle,
  follow: Heart,
  message_request: UserPlus,
  message_request_accepted: Check,
  profile_view: Bell,
  payout: Wallet,
  default: Bell,
};

export const Route = createFileRoute("/app/inbox")({
  validateSearch: (s: Record<string, unknown>): {
    tab?: "messages" | "requests" | "activity";
  } => {
    if (s.tab === "messages" || s.tab === "requests" || s.tab === "activity") {
      return { tab: s.tab };
    }
    return {};
  },
  head: () => ({ meta: [{ title: "Inbox · AgroLink" }] }),
  component: Inbox,
});

function Inbox() {
  const shellRole = useShellRole();
  const { user } = useAuth();
  const { tab: searchTab } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"activity" | "messages" | "requests">(searchTab ?? "messages");

  useEffect(() => {
    if (searchTab) setTab(searchTab);
  }, [searchTab]);

  const { data: notifications = [], isLoading: nLoading } = useNotifications(user?.id);
  const { data: conversations = [], isLoading: cLoading } = useConversations(user?.id);
  const {
    data: incomingRequests = [],
    isLoading: incomingLoading,
    refetch: refetchIncoming,
  } = useQuery({
    queryKey: ["message-requests", "incoming", user?.id],
    queryFn: () => fetchMessageRequests(user!.id),
    enabled: !!user?.id,
  });
  const {
    data: outgoingRequests = [],
    isLoading: outgoingLoading,
    refetch: refetchOutgoing,
  } = useQuery({
    queryKey: ["message-requests", "outgoing", user?.id],
    queryFn: () => fetchOutgoingMessageRequests(user!.id),
    enabled: !!user?.id,
  });
  const rLoading = incomingLoading || outgoingLoading;
  const refetchRequests = async () => {
    await Promise.all([refetchIncoming(), refetchOutgoing()]);
  };
  const { data: unread } = useUnreadCounts(user?.id);

  useEffect(() => {
    if (!user?.id) return;
    return subscribeToNotifications(user.id, (n) => {
      qc.invalidateQueries({ queryKey: ["notifications", user.id] });
      qc.invalidateQueries({ queryKey: ["unread-counts", user.id] });
      showLocalNotification(n.title, n.body ?? "", n.link ?? "/app/inbox");
    });
  }, [user?.id, qc]);

  const unreadNotis = unread?.notifications ?? notifications.filter((n) => !n.read).length;
  const unreadMsgs = unread?.messages ?? conversations.reduce((s, c) => s + c.unread, 0);
  const pendingRequests = incomingRequests.length + outgoingRequests.length;

  return (
    <AppShell role={shellRole} unreadInbox={(unreadNotis ?? 0) + (unreadMsgs ?? 0)} compact>
      <PageHeader
        eyebrow="Inbox"
        title={tab === "messages" ? "Your" : tab === "requests" ? "Message" : "Your"}
        italic={tab === "messages" ? "messages" : tab === "requests" ? "requests" : "activity"}
        sub={
          tab === "messages"
            ? "Chats with buyers, sellers, and drivers."
            : tab === "requests"
              ? "Incoming requests and ones you sent waiting for approval."
              : "Likes, orders, follows, and delivery alerts."
        }
        action={
          tab === "activity" && unreadNotis > 0 ? (
            <button
              onClick={() => user?.id && markAllNotificationsRead(user.id).then(() => qc.invalidateQueries())}
              className="text-xs text-primary hover:underline"
            >
              Mark all read
            </button>
          ) : undefined
        }
      />

      <div className="border-b border-border">
        <div className="flex gap-4 overflow-x-auto no-scrollbar sm:gap-8">
          {(["messages", "activity", "requests"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setTab(k);
                navigate({ to: "/app/inbox", search: { tab: k } });
              }}
              className={`shrink-0 border-b-2 px-1 pb-3 text-sm capitalize ${
                tab === k
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {k === "activity" ? "Activity" : k === "messages" ? "Messages" : "Requests"}
              {k === "activity" && unreadNotis > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                  {unreadNotis}
                </span>
              )}
              {k === "messages" && unreadMsgs > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                  {unreadMsgs}
                </span>
              )}
              {k === "requests" && pendingRequests > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                  {pendingRequests}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-[var(--space-block)] mx-auto w-full max-w-[var(--content-max)]">
        {tab === "activity" ? (
          nLoading ? (
            <div className="grid place-items-center py-16">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <ul className="relative z-10 divide-y divide-border rounded-3xl border border-border bg-card overflow-hidden isolate">
              {notifications.map((n) => {
                const Icon = ICON_MAP[n.type] ?? ICON_MAP.default;
                const isJob = n.type === "delivery_job";
                return (
                  <li
                    key={n.id}
                    className={`relative flex items-center gap-4 px-5 py-4 bg-card ${n.read ? "opacity-80" : "bg-muted/40"}`}
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-muted text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{n.title}</div>
                      {n.body && <div className="text-sm text-muted-foreground">{n.body}</div>}
                      <div className="text-[11px] text-muted-foreground/70">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                    {n.link ? (
                      (() => {
                        const target = parseNotificationTarget(n.link);
                        const onRead = () => {
                          markNotificationRead(n.id);
                          qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
                        };
                        if (target.params) {
                          return (
                            <Link
                              to={target.to}
                              params={target.params}
                              onClick={onRead}
                              className="text-xs text-primary shrink-0"
                            >
                              View profile
                            </Link>
                          );
                        }
                        return (
                          <Link to={target.to} onClick={onRead} className="text-xs text-primary shrink-0">
                            {isJob ? "View job" : "View"}
                          </Link>
                        );
                      })()
                    ) : (
                      <button
                        onClick={() => {
                          markNotificationRead(n.id);
                          qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
                        }}
                        className="text-xs text-muted-foreground"
                      >
                        Dismiss
                      </button>
                    )}
                  </li>
                );
              })}
              {notifications.length === 0 && (
                <li className="p-10 text-center text-muted-foreground">No notifications yet.</li>
              )}
            </ul>
          )
        ) : tab === "requests" ? (
          rLoading ? (
            <div className="grid place-items-center py-16">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : incomingRequests.length === 0 && outgoingRequests.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No pending requests. When you message someone new, it shows here until they accept.
            </div>
          ) : (
            <div className="space-y-6">
              {incomingRequests.length > 0 && (
                <section>
                  <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Incoming · needs your reply
                  </h3>
                  <ul className="divide-y divide-border rounded-3xl border border-border bg-card overflow-hidden">
                    {incomingRequests.map((r) => {
                      const requester = r.requester;
                      return (
                        <li key={`in-${r.requester_id}`} className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-primary font-semibold">
                              {requester?.avatar_url ? (
                                <img src={requester.avatar_url} alt="" className="h-full w-full object-cover" />
                              ) : (
                                (requester?.display_name ?? "?")[0]
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium">{requester?.display_name ?? "User"}</div>
                              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{r.preview}</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await respondToMessageRequest("accept", r.requester_id);
                                    await refetchRequests();
                                    qc.invalidateQueries({ queryKey: ["conversations", user?.id] });
                                    navigate({
                                      to: "/app/inbox/chat/$userId",
                                      params: { userId: r.requester_id },
                                    });
                                  }}
                                  className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground"
                                >
                                  <Check className="h-3 w-3" /> Accept
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await respondToMessageRequest("decline", r.requester_id);
                                    await refetchRequests();
                                  }}
                                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs"
                                >
                                  <X className="h-3 w-3" /> Decline
                                </button>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {outgoingRequests.length > 0 && (
                <section>
                  <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Sent · waiting for approval
                  </h3>
                  <ul className="divide-y divide-border rounded-3xl border border-border bg-card overflow-hidden">
                    {outgoingRequests.map((r) => {
                      const recipient = r.recipient;
                      const handle = recipient?.username ?? recipient?.slug ?? r.recipient_id;
                      return (
                        <li key={`out-${r.recipient_id}`} className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-primary font-semibold">
                              {recipient?.avatar_url ? (
                                <img src={recipient.avatar_url} alt="" className="h-full w-full object-cover" />
                              ) : (
                                (recipient?.display_name ?? "?")[0]
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium">{recipient?.display_name ?? "User"}</span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                                  <Clock className="h-3 w-3" /> Pending
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                {r.preview || "Waiting for them to accept your message request."}
                              </p>
                              <p className="mt-1 text-[11px] text-muted-foreground">
                                Sent {new Date(r.created_at).toLocaleString()}
                              </p>
                              {handle && (
                                <Link
                                  to="/app/users/$slug"
                                  params={{ slug: handle }}
                                  className="mt-2 inline-block text-xs text-primary hover:underline"
                                >
                                  View profile
                                </Link>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </div>
          )
        ) : cLoading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <ConversationList conversations={conversations} currentUserId={user?.id ?? ""} />
        )}
      </div>
    </AppShell>
  );
}
