import { createFileRoute } from "@tanstack/react-router";
import { Wallet, Download } from "lucide-react";
import { AppShell, PageHeader, StatCard } from "@/components/app/AppShell";
import { payouts } from "@/lib/mock-data";

export const Route = createFileRoute("/app/farmer/payouts")({
  head: () => ({ meta: [{ title: "Payouts · AgroLink" }] }),
  component: Payouts,
});

function Payouts() {
  const total = payouts.reduce((s, p) => s + p.amountGhs, 0);
  return (
    <AppShell role="farmer">
      <PageHeader
        eyebrow="Earnings"
        title="Your"
        italic="payouts"
        sub="Settled to mobile money the same evening."
        action={
          <button className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:border-primary/40">
            <Download className="h-4 w-4" /> Export
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Paid this month" value={`GHS ${total.toLocaleString()}`} />
        <StatCard label="Pending settlement" value="GHS 320" tone="accent" />
        <StatCard label="Default channel" value="MTN MoMo" sub="•••• 4421" tone="muted" />
      </div>

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
                <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{p.id}</td>
                <td className="px-5 py-4">{p.date}</td>
                <td className="px-5 py-4 inline-flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" />{p.channel}</td>
                <td className="px-5 py-4 text-right font-serif text-lg text-primary">GHS {p.amountGhs}</td>
                <td className="px-5 py-4 text-right text-xs text-foreground/70">{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
