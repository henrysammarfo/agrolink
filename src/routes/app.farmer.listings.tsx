import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Pencil, Eye, Heart, MessageCircle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { SellerStudioLayout } from "@/components/seller/SellerStudioLayout";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useAuth } from "@/lib/auth";
import { useSellerListings } from "@/hooks/use-marketplace";
import { deleteListing } from "@/lib/api/listings";
import { toast } from "sonner";

export const Route = createFileRoute("/app/farmer/listings")({
  head: () => ({ meta: [{ title: "Listings · AgroLink" }] }),
  component: Listings,
});

function Listings() {
  const { user } = useAuth();
  const { data: items = [], isLoading, refetch } = useSellerListings(user?.id);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const totals = {
    views: items.reduce((s, l) => s + (l.view_count ?? 0), 0),
    likes: items.reduce((s, l) => s + (l.like_count ?? 0), 0),
    comments: items.reduce((s, l) => s + (l.comment_count ?? 0), 0),
  };

  const confirmDelete = async () => {
    if (!pendingDelete || !user?.id) return;
    try {
      await deleteListing(pendingDelete, user.id);
      toast.success("Listing deleted");
      setPendingDelete(null);
      refetch();
    } catch {
      toast.error("Could not delete listing");
      throw new Error("delete failed");
    }
  };

  return (
    <SellerStudioLayout>
        <PageHeader
          eyebrow="Catalog"
          title="Your"
          italic="listings"
          sub="Edit, delete, or post new produce — photo or short video."
          action={
            <Link
              to="/app/create"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              <Plus className="h-4 w-4" /> New listing
            </Link>
          }
        />
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <MiniStat icon={Eye} label="Views" value={totals.views.toLocaleString()} />
          <MiniStat icon={Heart} label="Likes" value={totals.likes.toLocaleString()} />
          <MiniStat icon={MessageCircle} label="Comments" value={totals.comments.toLocaleString()} />
        </div>
        {isLoading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((l) => (
              <article key={l.id} className="overflow-hidden rounded-3xl border border-border bg-card">
                <div className="aspect-[4/5] relative bg-muted">
                  {l.image_url && (
                    <img src={l.image_url} alt={l.title} className="absolute inset-0 h-full w-full object-cover" />
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2 py-0.5 text-[10px] uppercase tracking-widest">
                    {l.status}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-serif text-xl">{l.title}</h3>
                  <p className="mt-1 text-sm text-primary">
                    GHS {l.price_per_unit}/{l.unit} · {l.quantity}
                    {l.unit}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{l.location_name}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Link
                      to="/app/farmer/listings/$listingId/edit"
                      params={{ listingId: l.id }}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary/40"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </Link>
                    <button
                      onClick={() => setPendingDelete(l.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-destructive hover:bg-destructive/5"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {items.length === 0 && (
              <div className="col-span-full rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
                No listings yet. Tap + to post your first produce.
              </div>
            )}
          </div>
        )}

        {pendingDelete && (
          <ConfirmDialog
            open={!!pendingDelete}
            onOpenChange={(v) => !v && setPendingDelete(null)}
            title="Delete this listing?"
            description="It will be removed from your profile and the feed. This cannot be undone."
            confirmLabel="Delete"
            tone="danger"
            onConfirm={confirmDelete}
          />
        )}
    </SellerStudioLayout>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
      <Icon className="h-5 w-5 text-primary" />
      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="font-serif text-2xl">{value}</div>
      </div>
    </div>
  );
}
