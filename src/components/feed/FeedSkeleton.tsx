import { Skeleton } from "@/components/ui/skeleton";

export function FeedSkeleton() {
  return (
    <div className="relative h-full w-full bg-black">
      <Skeleton className="absolute inset-0 rounded-none bg-white/10" />
      <div className="absolute inset-x-0 bottom-0 p-6 pb-24 space-y-3">
        <Skeleton className="h-4 w-32 bg-white/15" />
        <Skeleton className="h-8 w-3/4 bg-white/15" />
        <Skeleton className="h-4 w-1/2 bg-white/10" />
        <Skeleton className="h-12 w-full rounded-full bg-white/15" />
      </div>
      <div className="absolute right-4 bottom-32 flex flex-col gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-12 rounded-full bg-white/15" />
        ))}
      </div>
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div key={i} className="flex gap-4 rounded-2xl border border-border bg-card p-4">
          <Skeleton className="h-20 w-20 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FeedTeaserSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3">
          <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}
