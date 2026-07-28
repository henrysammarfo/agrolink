import { Link } from "@tanstack/react-router";
import type { Conversation } from "@/lib/api/chat";

export function ConversationList({
  conversations,
  currentUserId,
}: {
  conversations: Conversation[];
  currentUserId: string;
}) {
  if (conversations.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        <p>No conversations yet.</p>
        <p className="mt-2">
          Message someone from their profile — if they need to approve it, check the{" "}
          <Link to="/app/inbox" search={{ tab: "requests" }} className="text-primary underline-offset-2 hover:underline">
            Requests
          </Link>{" "}
          tab for pending status.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-3xl border border-border bg-card overflow-hidden">
      {conversations.map((c) => (
        <li key={c.partnerId}>
          <Link
            to="/app/inbox/chat/$userId"
            params={{ userId: c.partnerId }}
            search={c.orderId ? { order: c.orderId } : undefined}
            className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/50 transition"
          >
            <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/15 font-sans font-semibold text-primary overflow-hidden">
              {c.partnerAvatar ? (
                <img src={c.partnerAvatar} alt="" className="h-full w-full object-cover" />
              ) : (
                c.partnerName[0]?.toUpperCase() ?? "?"
              )}
              {c.unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {c.unread > 9 ? "9+" : c.unread}
                </span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{c.partnerName}</span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {formatRelative(c.lastAt)}
                </span>
              </div>
              <p className={`truncate text-sm ${c.unread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {c.lastMessage}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return new Date(iso).toLocaleDateString();
}
