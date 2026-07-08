import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Eye } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import { fetchProfileViewers } from "@/lib/api/profile-views";

export const Route = createFileRoute("/app/profile/views")({
  head: () => ({ meta: [{ title: "Profile views · AgroLink" }] }),
  component: ProfileViews,
});

function ProfileViews() {
  const { user } = useAuth();
  const { data: viewers = [], isLoading } = useQuery({
    queryKey: ["profile-viewers", user?.id],
    queryFn: () => fetchProfileViewers(user!.id),
    enabled: !!user?.id,
  });

  return (
    <AppShell role="buyer">
      <PageHeader eyebrow="Profile" title="Who viewed" italic="you" />
      <Link to="/app/profile" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to profile
      </Link>

      {isLoading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-3xl border border-border bg-card overflow-hidden">
          {viewers.map((v) => {
            const viewer = v.viewer as {
              id?: string;
              display_name?: string | null;
              avatar_url?: string | null;
              slug?: string | null;
            } | null;
            if (!viewer?.id) return null;
            return (
              <li key={v.id} className="flex items-center gap-4 px-5 py-4">
                {viewer.avatar_url ? (
                  <img src={viewer.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/15 font-semibold text-primary">
                    {(viewer.display_name ?? "?")[0]}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{viewer.display_name ?? "User"}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {new Date(v.viewed_at).toLocaleString()}
                  </div>
                </div>
                {viewer.slug ? (
                  <Link
                    to="/farmers/$slug"
                    params={{ slug: viewer.slug }}
                    className="text-xs text-primary shrink-0"
                  >
                    View profile
                  </Link>
                ) : null}
              </li>
            );
          })}
          {viewers.length === 0 && (
            <li className="p-10 text-center text-muted-foreground">No profile views yet.</li>
          )}
        </ul>
      )}
    </AppShell>
  );
}
