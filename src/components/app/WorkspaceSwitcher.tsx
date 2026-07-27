import { Link } from "@tanstack/react-router";
import { ShoppingBag, Truck, ShieldCheck, Sprout } from "lucide-react";
import { useAuth, type AppRole } from "@/lib/auth";
import { normalizeWorkspace } from "@/lib/active-workspace";
import { useWorkspaceSwitch } from "@/hooks/use-workspace-switch";

const OPTIONS: {
  role: AppRole;
  label: string;
  desc: string;
  icon: typeof ShoppingBag;
}[] = [
  { role: "buyer", label: "Market", desc: "Shop & orders", icon: ShoppingBag },
  { role: "transport", label: "Drive", desc: "Map & deliveries", icon: Truck },
  { role: "admin", label: "Admin", desc: "Operations panel", icon: ShieldCheck },
];

type Props = {
  compact?: boolean;
};

export function WorkspaceSwitcher({ compact = false }: Props) {
  const { roles, hasRole } = useAuth();
  const { activeNorm, switchTo } = useWorkspaceSwitch();

  const visible = OPTIONS.filter((o) => {
    if (o.role === "buyer") return hasRole("buyer") || hasRole("farmer");
    return hasRole(o.role);
  });

  if (visible.length <= 1 && !hasRole("farmer")) return null;

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {!compact && (
        <p className="text-xs text-muted-foreground">
          Market, Drive, and Admin — open Studio from Sell when you post.
        </p>
      )}
      {visible.length > 1 && (
        <div className={`grid gap-2 ${compact ? "grid-cols-2" : "sm:grid-cols-3"}`}>
          {visible.map((o) => {
            const isActive = activeNorm === normalizeWorkspace(o.role);
            return (
              <button
                key={o.role}
                type="button"
                onClick={() => switchTo(o.role)}
                className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition sm:p-4 ${
                  isActive
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border bg-background hover:border-primary/35"
                }`}
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}
                >
                  <o.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{o.label}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{o.desc}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
      {hasRole("farmer") && (
        <Link
          to="/app/farmer"
          className="flex items-center gap-3 rounded-2xl border border-dashed border-border p-3 text-left transition hover:border-primary/40 sm:p-4"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            <Sprout className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium">Open Studio</span>
            <span className="block truncate text-[11px] text-muted-foreground">
              Posts, sales & payouts
            </span>
          </span>
        </Link>
      )}
    </div>
  );
}
