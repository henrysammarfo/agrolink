import { useEffect, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Loader2, ShieldCheck, FileWarning } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { useAuth, type AppRole } from "@/lib/auth";
import { useDriverProfile } from "@/hooks/use-marketplace";
import { isDriverVerified } from "@/lib/api/driver-onboarding";

export function RoleGate({
  role,
  children,
  fallback = "/app/buyer",
}: {
  role: AppRole;
  children: ReactNode;
  fallback?: "/app/buyer" | "/app/farmer" | "/app/transport" | "/app/admin";
}) {
  const { roles, loading } = useAuth();
  const navigate = useNavigate();
  const allowed = roles.includes(role);

  useEffect(() => {
    if (!loading && !allowed) navigate({ to: fallback, replace: true });
  }, [allowed, fallback, loading, navigate]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <AppShell role={roles[0] ?? "buyer"}>
        <div className="mx-auto max-w-xl rounded-3xl border border-amber-300 bg-amber-50 p-8 text-center dark:bg-amber-950/30">
          <ShieldCheck className="mx-auto h-10 w-10 text-amber-600" />
          <h2 className="mt-3 font-serif text-2xl">{role[0].toUpperCase() + role.slice(1)} access needed</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This page belongs to the {role} workspace. Enable that role in settings or sign in with the right account.
          </p>
        </div>
      </AppShell>
    );
  }

  return <>{children}</>;
}

export function AdminGate({ children }: { children: ReactNode }) {
  return <RoleGate role="admin" fallback="/app/buyer">{children}</RoleGate>;
}

export function FarmerGate({ children }: { children: ReactNode }) {
  return <RoleGate role="farmer" fallback="/app/buyer">{children}</RoleGate>;
}

export function TransportGate({ children }: { children: ReactNode }) {
  return <RoleGate role="transport" fallback="/app/buyer">{children}</RoleGate>;
}

/** Uber/Bolt-style gate: transport role + approved driver verification */
export function VerifiedTransportGate({ children }: { children: ReactNode }) {
  const { roles, user, loading: authLoading } = useAuth();
  const { data: driver, isLoading: driverLoading } = useDriverProfile(user?.id);
  const navigate = useNavigate();
  const hasRole = roles.includes("transport");
  const verified = isDriverVerified(driver ?? null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onRegister = pathname.includes("/transport/register");

  useEffect(() => {
    if (authLoading || driverLoading || !hasRole) return;
    if (!verified && !onRegister) {
      navigate({ to: "/app/transport/register", replace: true });
    }
  }, [authLoading, driverLoading, hasRole, verified, onRegister, navigate]);

  if (authLoading || driverLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TransportGate>
      {!verified && onRegister ? (
        children
      ) : !verified ? (
        <AppShell role="transport">
          <div className="mx-auto max-w-xl rounded-3xl border border-amber-300 bg-amber-50 p-8 text-center dark:bg-amber-950/30">
            <FileWarning className="mx-auto h-10 w-10 text-amber-600" />
            <h2 className="mt-3 font-serif text-2xl">Complete driver verification</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Upload your license, vehicle registration, insurance, Ghana Card, and profile photo before going online.
            </p>
            <Link
              to="/app/transport/register"
              className="mt-6 inline-flex rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background"
            >
              Start registration
            </Link>
          </div>
        </AppShell>
      ) : (
        children
      )}
    </TransportGate>
  );
}
