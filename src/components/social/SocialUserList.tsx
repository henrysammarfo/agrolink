import { Link } from "@tanstack/react-router";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { FollowUser } from "@/lib/api/engagement";
import { toggleFollow, fetchIsFollowing } from "@/lib/api/engagement";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export function SocialUserList({
  users,
  loading,
  emptyLabel,
}: {
  users: FollowUser[];
  loading?: boolean;
  emptyLabel: string;
}) {
  if (loading) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {users.map((u) => (
        <SocialUserRow key={u.id} user={u} />
      ))}
    </div>
  );
}

function SocialUserRow({ user }: { user: FollowUser }) {
  const { user: me, profile } = useAuth();
  const qc = useQueryClient();
  const slug = user.slug ?? user.username ?? user.id;
  const followKey = user.slug ?? user.username ?? "";
  const [following, setFollowing] = useState(false);
  const [checked, setChecked] = useState(false);

  if (me?.id && !checked && followKey && me.id !== user.id) {
    void fetchIsFollowing(me.id, followKey).then((v) => {
      setFollowing(v);
      setChecked(true);
    });
  }

  const onFollow = async () => {
    if (!me?.id || !followKey) return;
    const next = !following;
    setFollowing(next);
    try {
      await toggleFollow(me.id, followKey, next, profile?.display_name ?? undefined);
      await qc.invalidateQueries({ queryKey: ["following"] });
      toast.success(next ? "Following" : "Unfollowed");
    } catch {
      setFollowing(!next);
      toast.error("Could not update follow");
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <Link to="/farmers/$slug" params={{ slug }} className="flex min-w-0 flex-1 items-center gap-3">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <span className="grid h-12 w-12 place-items-center rounded-full bg-muted font-serif text-lg">
            {(user.display_name ?? "?")[0]}
          </span>
        )}
        <div className="min-w-0">
          <div className="truncate font-medium">{user.display_name ?? "User"}</div>
          <div className="truncate text-xs text-muted-foreground">
            @{user.username ?? user.slug?.replace(/-/g, "") ?? "user"}
            {user.region ? ` · ${user.region}` : ""}
            {user.follows_you ? (
              <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                Follows you
              </span>
            ) : null}
          </div>
        </div>
      </Link>
      {me?.id && me.id !== user.id && followKey && (
        <button
          type="button"
          onClick={onFollow}
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium ${
            following ? "border border-border" : "bg-foreground text-background"
          }`}
        >
          {following ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
          {following ? "Following" : "Follow"}
        </button>
      )}
    </div>
  );
}
