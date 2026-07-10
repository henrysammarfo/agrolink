import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { loadActiveWorkspace, roleHome } from "@/lib/active-workspace";

export const Route = createFileRoute("/app/")({
  component: AppHome,
});

function AppHome() {
  const { roles, loading, user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading || !user) return;
    const dest = roleHome(loadActiveWorkspace(user.id, roles));
    navigate({ to: dest, replace: true });
  }, [roles, loading, navigate, user]);
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
    </div>
  );
}
