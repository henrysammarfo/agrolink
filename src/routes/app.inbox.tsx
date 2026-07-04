import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, MessageCircle, Truck, Wallet, Bell, Loader2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import { useNotifications, useMessages } from "@/hooks/use-marketplace";
import { markNotificationRead } from "@/lib/api/notifications";

const ICON_MAP: Record<string, typeof Heart> = {
  like: Heart,
  comment: MessageCircle,
  order_confirmed: Truck,
  delivery: Truck,
  payout: Wallet,
  default: Bell,
};

export const Route = createFileRoute("/app/inbox")({
  head: () => ({ meta: [{ title: "Inbox · AgroLink" }] }),
  component: Inbox,
});

function Inbox() {
  const { user } = useAuth();
  const { data: notifications = [], isLoading: nLoading } = useNotifications(user?.id);
  const { data: messages = [], isLoading: mLoading } = useMessages(user?.id);
  const [tab, setTab] = useState<"activity" | "messages">("activity");

  const unreadMsgs = messages.filter((m) => !m.read && m.receiver_id === user?.id).length;

  return (
    <AppShell role="buyer">
      <PageHeader
        eyebrow="Inbox"
        title="Your"
        italic="updates"
        sub="Likes, comments, orders and messages — all in one place."
      />

      <div className="border-b border-border">
        <div className="flex gap-8">
          {(["activity", "messages"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`border-b-2 px-1 pb-3 text-sm capitalize ${tab === k ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {k}{" "}
              {k === "messages" && unreadMsgs > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                  {unreadMsgs}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {tab === "activity" ? (
        nLoading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-border rounded-3xl border border-border bg-card">
            {notifications.map((n) => {
              const Icon = ICON_MAP[n.type] ?? ICON_MAP.default;
              return (
                <li
                  key={n.id}
                  className={`flex items-center gap-4 px-5 py-4 ${n.read ? "opacity-70" : ""}`}
                  onClick={() => markNotificationRead(n.id)}
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
                  {n.link && (
                    <Link to={n.link} className="text-xs text-primary">
                      View
                    </Link>
                  )}
                </li>
              );
            })}
            {notifications.length === 0 && (
              <li className="p-10 text-center text-muted-foreground">No notifications yet.</li>
            )}
          </ul>
        )
      ) : mLoading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-3xl border border-border bg-card">
          {messages.map((m) => (
            <li key={m.id} className="flex items-center gap-4 px-5 py-4">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 font-serif text-primary">
                {(m.sender?.display_name ?? "U")[0]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{m.sender?.display_name ?? "User"}</div>
                <div className="truncate text-sm text-muted-foreground">{m.content}</div>
              </div>
              <div className="text-[11px] text-muted-foreground">
                {new Date(m.created_at).toLocaleTimeString()}
              </div>
            </li>
          ))}
          {messages.length === 0 && (
            <li className="p-10 text-center text-muted-foreground">No messages yet.</li>
          )}
        </ul>
      )}
    </AppShell>
  );
}
