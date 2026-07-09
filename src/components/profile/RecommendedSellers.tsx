import { Link } from "@tanstack/react-router";
import { BadgeCheck, MapPin } from "lucide-react";
import type { PublicProfile } from "@/lib/api/profiles";

function sellerSlug(s: PublicProfile) {
  return (s.username ?? s.slug ?? s.id).trim();
}

type Props = {
  sellers: PublicProfile[];
  excludeUserId?: string;
  limit?: number;
};

export function RecommendedSellers({ sellers, excludeUserId, limit = 6 }: Props) {
  const items = sellers
    .filter((s) => s.id !== excludeUserId && sellerSlug(s))
    .slice(0, limit);

  if (!items.length) return null;

  return (
    <section className="mt-6">
      <h3 className="px-1 font-serif text-lg sm:text-xl">Recommended sellers</h3>
      <div className="mt-3 -mx-1 flex gap-3 overflow-x-auto px-1 pb-1 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-3">
        {items.map((s) => {
          const slug = sellerSlug(s);
          const name = s.display_name ?? "Farmer";
          return (
            <Link
              key={s.id}
              to="/app/users/$slug"
              params={{ slug }}
              className="flex w-[9.5rem] shrink-0 flex-col rounded-2xl border border-border bg-card p-3 transition hover:border-primary/40 sm:w-auto"
            >
              <div className="flex items-center gap-3">
                {s.avatar_url ? (
                  <img src={s.avatar_url} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" loading="lazy" />
                ) : (
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/15 font-serif text-lg text-primary">
                    {name[0]?.toUpperCase() ?? "F"}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 truncate text-sm font-medium">
                    <span className="truncate">{name}</span>
                    {s.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />}
                  </div>
                  {s.region && (
                    <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {s.region}
                    </p>
                  )}
                </div>
              </div>
              {(s.listing_count != null || s.follower_count != null) && (
                <p className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {s.listing_count != null && `${s.listing_count} listings`}
                  {s.listing_count != null && s.follower_count != null && " · "}
                  {s.follower_count != null && `${s.follower_count} followers`}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
