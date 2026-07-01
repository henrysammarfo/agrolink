import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Edit3, Trash2, Eye, Heart, MessageCircle } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { FarmerGate } from "@/components/app/RoleGate";
import { listings, type Listing } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/app/farmer/listings")({
  head: () => ({ meta: [{ title: "Listings · AgroLink" }] }),
  component: Listings,
});

function Listings() {
  const [items, setItems] = useState<Listing[]>(() => readSellerListings());

  const totals = useMemo(() => ({
    views: items.reduce((s, l) => s + (l.views ?? 0), 0),
    likes: items.reduce((s, l) => s + (l.likes ?? 0), 0),
    comments: items.reduce((s, l) => s + (l.comments?.length ?? 0), 0),
  }), [items]);

  const remove = (id: string) => {
    setItems((curr) => {
      const next = curr.filter((l) => l.id !== id);
      saveSellerListings(next.filter((l) => !listings.some((seed) => seed.id === l.id)));
      saveRemovedListing(id);
      return next;
    });
    toast.success("Listing removed from seller catalog");
  };

  return (
    <FarmerGate>
    <AppShell role="farmer">
      <PageHeader
        eyebrow="Catalog"
        title="Your"
        italic="listings"
        sub="Edit prices, restock, or pull listings out of the feed."
        action={
          <Link to="/app/create" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> New listing
          </Link>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <MiniStat icon={Eye} label="Views" value={totals.views.toLocaleString()} />
        <MiniStat icon={Heart} label="Likes" value={totals.likes.toLocaleString()} />
        <MiniStat icon={MessageCircle} label="Comments" value={totals.comments.toLocaleString()} />
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-5 py-4 text-left">Produce</th>
              <th className="px-5 py-4 text-left">Available</th>
              <th className="px-5 py-4 text-left">Price</th>
              <th className="px-5 py-4 text-left">Posted</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((l) => (
              <tr key={l.id} className="hover:bg-background/40 transition">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                      <img src={l.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </div>
                    <div>
                      <div className="font-medium">{l.produce}</div>
                      <div className="text-xs text-muted-foreground">{l.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">{l.quantityKg} kg</td>
                <td className="px-5 py-4 text-primary">GHS {l.pricePerKg}/kg</td>
                <td className="px-5 py-4 text-muted-foreground">{l.postedHoursAgo}h ago</td>
                <td className="px-5 py-4 text-right">
                  <div className="inline-flex gap-2">
                    <button onClick={() => toast.message("Edit draft opened", { description: l.produce })} className="grid h-9 w-9 place-items-center rounded-full border border-border hover:border-primary/40"><Edit3 className="h-4 w-4" /></button>
                    <button onClick={() => remove(l.id)} className="grid h-9 w-9 place-items-center rounded-full border border-border hover:border-destructive/60 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
    </FarmerGate>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"><Icon className="h-3.5 w-3.5 text-primary" /> {label}</div>
      <div className="mt-2 font-serif text-3xl text-foreground">{value}</div>
    </div>
  );
}

function readSellerListings(): Listing[] {
  if (typeof window === "undefined") return listings;
  try {
    const local = JSON.parse(localStorage.getItem("agrolink:created-listings:v1") || "[]") as Listing[];
    const removed = JSON.parse(localStorage.getItem("agrolink:removed-listings:v1") || "[]") as string[];
    return [...local, ...listings.filter((l) => !removed.includes(l.id))];
  } catch {
    return listings;
  }
}

function saveSellerListings(items: Listing[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("agrolink:created-listings:v1", JSON.stringify(items));
}

function saveRemovedListing(id: string) {
  if (typeof window === "undefined") return;
  try {
    const current = JSON.parse(localStorage.getItem("agrolink:removed-listings:v1") || "[]") as string[];
    localStorage.setItem("agrolink:removed-listings:v1", JSON.stringify(Array.from(new Set([...current, id]))));
  } catch {
    localStorage.setItem("agrolink:removed-listings:v1", JSON.stringify([id]));
  }
}
