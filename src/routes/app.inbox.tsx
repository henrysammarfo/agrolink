import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, MessageCircle, Truck, UserPlus, Eye, Wallet, BadgeCheck } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { listings } from "@/lib/mock-data";

export const Route = createFileRoute("/app/inbox")({
  head: () => ({ meta: [{ title: "Inbox · AgroLink" }] }),
  component: Inbox,
});

const NOTIFS = [
  { id: "n1", icon: Heart, color: "text-rose-500", who: "Esi Owusu", what: "liked your tomato listing", when: "2m" },
  { id: "n2", icon: MessageCircle, color: "text-primary", who: "Skybar East Legon", what: "commented: \"Can you do 30kg by 11am?\"", when: "12m" },
  { id: "n3", icon: Truck, color: "text-accent", who: "Yaw Ofori", what: "picked up order OR-8821", when: "32m" },
  { id: "n4", icon: UserPlus, color: "text-primary", who: "Chef Ama", what: "started following you", when: "1h" },
  { id: "n5", icon: Eye, color: "text-muted-foreground", who: "12 people", what: "viewed your profile today", when: "3h" },
  { id: "n6", icon: Wallet, color: "text-primary", who: "Payout", what: "GHS 540 settled to MTN MoMo", when: "Yesterday" },
];

const DMS = [
  { id: "d1", who: "Skybar East Legon", last: "Can you do 30kg by 11am?", when: "12m", unread: true },
  { id: "d2", who: "Bistro 22", last: "Thanks! Your pepper was perfect.", when: "2h", unread: false },
  { id: "d3", who: "Yaw Ofori (driver)", last: "Picked up, on my way 🚚", when: "32m", unread: true },
];

function Inbox() {
  const [tab, setTab] = useState<"activity" | "messages">("activity");

  return (
    <AppShell role="buyer">
      <PageHeader eyebrow="Inbox" title="Your" italic="updates" sub="Likes, comments, follows, orders and DMs — all in one place." />

      <div className="border-b border-border">
        <div className="flex gap-8">
          {(["activity", "messages"] as const).map((k) => (
            <button
              key={k} onClick={() => setTab(k)}
              className={`border-b-2 px-1 pb-3 text-sm capitalize ${tab === k ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {k} {k === "messages" && <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">2</span>}
            </button>
          ))}
        </div>
      </div>

      {tab === "activity" ? (
        <ul className="mt-6 divide-y divide-border rounded-3xl border border-border bg-card">
          {NOTIFS.map((n) => (
            <li key={n.id} className="flex items-center gap-4 px-5 py-4">
              <span className={`grid h-10 w-10 place-items-center rounded-full bg-muted ${n.color}`}>
                <n.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm">
                  <span className="font-medium">{n.who}</span>{" "}
                  <span className="text-muted-foreground">{n.what}</span>
                </div>
                <div className="text-[11px] text-muted-foreground/70">{n.when} ago</div>
              </div>
              {n.icon === Heart && (
                <Link to="/app/buyer/feed" className="hidden sm:block">
                  <img src={listings[0].image} alt="" className="h-12 w-9 rounded-md object-cover" />
                </Link>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-3xl border border-border bg-card">
          {DMS.map((d) => (
            <li key={d.id} className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/40 cursor-pointer">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/15 font-serif text-primary">{d.who[0]}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {d.who} <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="truncate text-xs text-muted-foreground">{d.last}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-muted-foreground/70">{d.when}</div>
                {d.unread && <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
