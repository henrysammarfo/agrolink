import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { ChatThread } from "@/components/chat/ChatThread";
import { useAuth } from "@/lib/auth";
import { resolveAppRole } from "@/lib/app-role";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/inbox/chat/$userId")({
  validateSearch: (s: Record<string, unknown>) => ({
    order: typeof s.order === "string" ? s.order : undefined,
  }),
  head: () => ({ meta: [{ title: "Chat · AgroLink" }] }),
  component: ChatPage,
});

function ChatPage() {
  const { userId: partnerId } = Route.useParams();
  const { order } = Route.useSearch();
  const { user, profile, roles } = useAuth();

  const { data: partner, isLoading } = useQuery({
    queryKey: ["chat-partner", partnerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .eq("id", partnerId)
        .maybeSingle();
      return data;
    },
    enabled: !!partnerId,
  });

  if (!user?.id) {
    return (
      <AppShell role={resolveAppRole(roles)} compact>
        <div className="py-20 text-center text-muted-foreground">Sign in to chat.</div>
      </AppShell>
    );
  }

  return (
    <AppShell role={resolveAppRole(roles)} compact>
      {!partner && isLoading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !partner ? (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">User not found</p>
          <Link to="/app/inbox" className="mt-4 text-primary underline">
            Back to inbox
          </Link>
        </div>
      ) : (
        <ChatThread
          userId={user.id}
          partnerId={partnerId}
          partnerName={partner.display_name ?? "User"}
          senderName={profile?.display_name ?? "You"}
          orderId={order}
        />
      )}
    </AppShell>
  );
}
