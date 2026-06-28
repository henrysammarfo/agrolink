import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/app/")({
  component: AppHome,
});

function AppHome() {
  const { roles, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    const dest = roles.includes("transport")
      ? "/app/transport"
      : roles.includes("farmer")
      ? "/app/farmer"
      : "/app/buyer";
    navigate({ to: dest, replace: true });
  }, [roles, loading, navigate]);
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
    </div>
  );
}
