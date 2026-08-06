import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/buyer")({
  head: () => ({ meta: [{ title: "Buyer · AgroLink" }] }),
  beforeLoad: ({ location }) => {
    const path = location.pathname.replace(/\/$/, "") || "/";
    if (path === "/app/buyer") {
      throw redirect({ to: "/app/buyer/feed" });
    }
  },
  component: BuyerLayout,
});

/** Nested buyer routes (feed, cart, orders, payments, …). Auth gated by `/app`. */
function BuyerLayout() {
  return <Outlet />;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    confirmed: "bg-accent/20 text-accent",
    processing: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
    dispatched: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    in_transit: "bg-primary/20 text-primary",
    delivered: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    cancelled: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
  };
  return (
    <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${map[status] ?? ""}`}>
      {status.replace("_", " ")}
    </span>
  );
}
