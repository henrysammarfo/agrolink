import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app/AppShell";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings · AgroLink" }] }),
  component: Settings,
});

function Settings() {
  const [whatsapp, setWhatsapp] = useState(true);
  const [push, setPush] = useState(true);
  const [marketing, setMarketing] = useState(false);

  return (
    <AppShell role="buyer">
      <PageHeader eyebrow="Account" title="Your" italic="settings" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Profile">
          <FieldRow label="Full name" defaultValue="Ama Mensah" />
          <FieldRow label="Phone" defaultValue="+233 24 555 0123" />
          <FieldRow label="Email" defaultValue="ama@example.gh" />
          <FieldRow label="Location" defaultValue="East Legon, Accra" />
        </Card>

        <Card title="Notifications">
          <Toggle label="WhatsApp updates" desc="Order status, dispatch and payment alerts." value={whatsapp} onChange={setWhatsapp} />
          <Toggle label="Push notifications" desc="Mobile app push." value={push} onChange={setPush} />
          <Toggle label="Marketing emails" desc="Seasonal produce + drops." value={marketing} onChange={setMarketing} />
        </Card>

        <Card title="Payment">
          <FieldRow label="MoMo number" defaultValue="+233 24 555 0123" />
          <FieldRow label="Channel" defaultValue="MTN MoMo" />
        </Card>

        <Card title="Security">
          <FieldRow label="Password" defaultValue="••••••••••" />
          <button className="mt-4 rounded-full border border-border px-5 py-2 text-sm hover:border-primary/40">Enable 2FA</button>
        </Card>
      </div>
    </AppShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6">
      <h2 className="font-serif text-2xl">{title}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function FieldRow({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <input defaultValue={defaultValue} className="mt-2 block w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary" />
    </label>
  );
}

function Toggle({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-4">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${value ? "bg-primary" : "bg-border"}`}
        aria-pressed={value}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-transform ${value ? "translate-x-[22px]" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}
