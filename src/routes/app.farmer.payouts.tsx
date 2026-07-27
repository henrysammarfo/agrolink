import { createFileRoute } from "@tanstack/react-router";
import { Wallet, Download, Loader2 } from "lucide-react";
import { PageHeader, StatCard } from "@/components/app/AppShell";
import { SellerStudioLayout } from "@/components/seller/SellerStudioLayout";
import { useAuth } from "@/lib/auth";
import { usePayouts } from "@/hooks/use-marketplace";

export const Route = createFileRoute("/app/farmer/payouts")({
  head: () => ({ meta: [{ title: "Payouts · AgroLink" }] }),
  component: Payouts,
});

function Payouts() {
  const { user } = useAuth();
  const { data: payouts = [], isLoading } = usePayouts(user?.id);
  const paid = payouts.filter((p) => p.status === "paid");
  const pending = payouts.filter((p) => p.status === "pending" || p.status === "processing");
  const totalPaid = paid.reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = pending.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <SellerStudioLayout>
      <PageHeader
        eyebrow="Earnings"
        title="Your"
        italic="payouts"
        sub="Settled to mobile money via Paystack Transfers."
        action={
          <button className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:border-primary/40">
            <Download className="h-4 w-4" /> Export
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Paid total" value={`GHS ${totalPaid.toLocaleString()}`} />
        <StatCard label="Pending settlement" value={`GHS ${totalPending.toLocaleString()}`} tone="accent" />
        <StatCard label="Payout count" value={String(payouts.length)} tone="muted" />
      </div>

      {isLoading ? (
        <div className="mt-10 flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
      <div className="mt-10 overflow-hidden rounded-3xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-5 py-4 text-left">Ref</th>
              <th className="px-5 py-4 text-left">Date</th>
              <th className="px-5 py-4 text-left">Channel</th>
              <th className="px-5 py-4 text-right">Amount</th>
              <th className="px-5 py-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payouts.map((p) => (
              <tr key={p.id}>
                <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{p.id.slice(0, 8)}</td>
                <td className="px-5 py-4">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-4 inline-flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  {p.momo_network ?? "MoMo"} {p.momo_number ? `· ${p.momo_number}` : ""}
                </td>
                <td className="px-5 py-4 text-right font-serif text-lg text-primary">GHS {p.amount}</td>
                <td className="px-5 py-4 text-right text-xs capitalize text-foreground/70">{p.status}</td>
              </tr>
            ))}
            {payouts.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No payouts yet — they appear after delivered orders settle.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      )}
    </SellerStudioLayout>
  );
}
