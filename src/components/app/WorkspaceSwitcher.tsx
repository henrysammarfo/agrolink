import { useNavigate } from "@tanstack/react-router";
import { ShoppingBag, Sprout, Truck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth, type AppRole } from "@/lib/auth";
import { useDriverProfile } from "@/hooks/use-marketplace";
import { isDriverVerified } from "@/lib/api/driver-onboarding";
import { saveActiveWorkspace, roleHome } from "@/lib/active-workspace";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";

const OPTIONS: {
  role: AppRole;
  label: string;
  desc: string;
  icon: typeof ShoppingBag;
  needsVerification?: boolean;
}[] = [
  { role: "buyer", label: "Shop", desc: "Feed & orders", icon: ShoppingBag },
  { role: "farmer", label: "Sell", desc: "Listings & payouts", icon: Sprout },
  { role: "transport", label: "Drive", desc: "Map & deliveries", icon: Truck, needsVerification: true },
  { role: "admin", label: "Admin", desc: "Operations panel", icon: ShieldCheck },
];

type Props = {
  compact?: boolean;
};

export function WorkspaceSwitcher({ compact = false }: Props) {
  const navigate = useNavigate();
  const { user, roles, hasRole } = useAuth();
  const { data: driverProfile } = useDriverProfile(user?.id);
  const { active, setWorkspace } = useActiveWorkspace(user?.id, roles);
  const visible = OPTIONS.filter((o) => hasRole(o.role));

  if (visible.length <= 1) return null;

  const switchTo = (role: AppRole) => {
    if (!hasRole(role)) {
      toast.error("Enable this workspace in Settings first");
      navigate({ to: "/app/settings" });
      return;
    }
    if (user?.id) setWorkspace(role);
    if (role === "transport") {
      navigate({
        to: isDriverVerified(driverProfile ?? null) ? "/app/transport" : "/app/transport/register",
      });
      return;
    }
    navigate({ to: roleHome(role) as "/app/buyer" });
  };

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {!compact && (
        <p className="text-xs text-muted-foreground">Switch dashboard — one account, multiple workspaces.</p>
      )}
      <div className={`grid gap-2 ${compact ? "grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
        {visible.map((o) => {
          const isActive = active === o.role;
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
    </div>
  );
}
