import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Check, Trash2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin/listings")({
  head: () => ({ meta: [{ title: "Listing reports · Admin · AgroLink" }] }),
  component: AdminListings,
});

type ListingRow = {
  id: string;
  title: string;
  status: string;
  seller_id: string;
  created_at: string;
  report_count: number;
};

function AdminListings() {
  const [items, setItems] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase
      .from("listings")
      .select("id, title, status, seller_id, created_at, report_count")
      .in("status", ["pending_review", "active", "rejected"])
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems(data ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = items.filter((r) => !q || r.title.toLowerCase().includes(q.toLowerCase()));

  const approve = async (id: string) => {
    await supabase.from("listings").update({ status: "active" }).eq("id", id);
    setItems((curr) => curr.map((r) => (r.id === id ? { ...r, status: "active" } : r)));
    toast.success("Listing approved");
  };

  const remove = async (id: string) => {
    await supabase.from("listings").update({ status: "rejected" }).eq("id", id);
    setItems((curr) => curr.map((r) => (r.id === id ? { ...r, status: "rejected" } : r)));
    toast.success("Listing removed");
  };

  return (
    <>
        <PageHeader
          eyebrow="Moderation"
          title="Listing"
          italic="review"
          sub="Approve or reject listings before they appear in the feed."
        />
        <div className="mb-6 flex gap-3">
          <label className="inline-flex flex-1 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search listings…"
              className="min-w-0 flex-1 bg-transparent outline-none"
            />
          </label>
        </div>
        {loading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-5 py-4 text-left">Listing</th>
                  <th className="px-5 py-4 text-left">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-4">
                      <div className="font-medium">{r.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-5 py-4 capitalize">{r.status.replace(/_/g, " ")}</td>
                    <td className="px-5 py-4 text-right">
                      {r.status === "pending_review" && (
                        <>
                          <button
                            onClick={() => approve(r.id)}
                            className="mr-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-700"
                          >
                            <Check className="h-3 w-3" /> Approve
                          </button>
                          <button
                            onClick={() => remove(r.id)}
                            className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-3 py-1 text-xs text-rose-600"
                          >
                            <Trash2 className="h-3 w-3" /> Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-10 text-center text-muted-foreground">No listings to review.</div>
            )}
          </div>
        )}
    </>
  );
}
