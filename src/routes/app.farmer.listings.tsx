import { createFileRoute } from "@tanstack/react-router";
import { Plus, Edit3, Trash2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { listings } from "@/lib/mock-data";

export const Route = createFileRoute("/app/farmer/listings")({
  head: () => ({ meta: [{ title: "Listings · AgroLink" }] }),
  component: Listings,
});

function Listings() {
  return (
    <AppShell role="farmer">
      <PageHeader
        eyebrow="Catalog"
        title="Your"
        italic="listings"
        sub="Edit prices, restock, or pull listings out of the feed."
        action={
          <button className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> New listing
          </button>
        }
      />

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
            {listings.map((l) => (
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
                    <button className="grid h-9 w-9 place-items-center rounded-full border border-border hover:border-primary/40"><Edit3 className="h-4 w-4" /></button>
                    <button className="grid h-9 w-9 place-items-center rounded-full border border-border hover:border-destructive/60 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
