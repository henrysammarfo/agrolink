import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { ChatThread } from "@/components/chat/ChatThread";
import { useAuth } from "@/lib/auth";
import { useShellRole } from "@/hooks/use-shell-role";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/inbox/chat/$userId")({
  validateSearch: (s: Record<string, unknown>): {
    order?: string;
    delivery?: string;
  } => ({
    order: typeof s.order === "string" ? s.order : undefined,
    delivery: typeof s.delivery === "string" ? s.delivery : undefined,
  }),
  head: () => ({ meta: [{ title: "Chat · AgroLink" }] }),
  component: ChatPage,
});

function ChatPage() {
  const { userId: partnerId } = Route.useParams();
  const { order, delivery: deliveryFromSearch } = Route.useSearch();
  const shellRole = useShellRole();
  const { user, profile } = useAuth();

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

  const { data: resolvedDeliveryId } = useQuery({
    queryKey: ["chat-delivery", order],
    queryFn: async () => {
      const { data } = await supabase
        .from("deliveries")
        .select("id")
        .eq("order_id", order!)
        .maybeSingle();
      return data?.id ?? null;
    },
    enabled: !!order && !deliveryFromSearch,
  });

  const deliveryId = deliveryFromSearch ?? resolvedDeliveryId ?? undefined;

  if (!user?.id) {
    return (
      <AppShell role={shellRole} compact>
        <div className="py-20 text-center text-muted-foreground">Sign in to chat.</div>
      </AppShell>
    );
  }

  return (
    <AppShell role={shellRole} compact>
      {!partner && isLoading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !partner ? (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">User not found</p>
          <Link to="/app/inbox" search={{ tab: "messages" }} className="mt-4 text-primary underline">
            Back to messages
          </Link>
        </div>
      ) : (
        <ChatThread
          userId={user.id}
          partnerId={partnerId}
          partnerName={partner.display_name ?? "User"}
          senderName={profile?.display_name ?? "You"}
          orderId={order}
          deliveryId={deliveryId}
          tripMode={!!(order || deliveryId)}
        />
      )}
    </AppShell>
  );
}
