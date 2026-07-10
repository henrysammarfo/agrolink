import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import { trackEvent } from "@/lib/analytics";
import { apiFetch } from "@/lib/api/fetch-auth";

export const Route = createFileRoute("/app/admin/pricing")({
  head: () => ({ meta: [{ title: "Surge pricing · AgroLink Admin" }] }),
  component: AdminPricing,
});

type PricingConfig = {
  id: string;
  name: string;
  base_fare: number;
  per_km_rate: number;
  surge_multiplier: number;
  surge_active: boolean;
  surge_reason: string | null;
  peak_multiplier: number;
};

function AdminPricing() {
  const { user } = useAuth();
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mult, setMult] = useState("1.2");
  const [active, setActive] = useState(false);
  const [reason, setReason] = useState("Rainy season corridor demand");

  useEffect(() => {
    apiFetch("/api/admin/pricing")
      .then((r) => r.json())
      .then((d: { config: PricingConfig }) => {
        if (d.config) {
          setConfig(d.config);
          setMult(String(d.config.surge_multiplier ?? 1));
          setActive(!!d.config.surge_active);
          setReason(d.config.surge_reason ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const res = await apiFetch("/api/admin/pricing", {
        method: "PATCH",
        body: JSON.stringify({
          surge_multiplier: Number(mult),
          surge_active: active,
          surge_reason: reason,
        }),
      });
      const data = (await res.json()) as { config?: PricingConfig; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setConfig(data.config ?? null);
      trackEvent("admin_surge_updated", { multiplier: mult, active });
      toast.success(active ? `Surge ${mult}× active` : "Surge disabled");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
        <PageHeader
          eyebrow="Admin"
          title="Delivery"
          italic="surge"
          sub="Bolt-style surge multiplier for rainy season and peak corridor demand."
        />

        {loading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="max-w-xl space-y-6">
            <div className="rounded-3xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/15 text-amber-600">
                  <Zap className="h-6 w-6" />
                </span>
                <div>
                  <div className="font-sans text-lg font-semibold">Surge pricing</div>
                  <div className="text-sm text-muted-foreground">
                    Base fare GHS {config?.base_fare ?? "—"} · {config?.per_km_rate ?? "—"}/km
                  </div>
                </div>
              </div>

              <label className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-4">
                <div>
                  <div className="text-sm font-medium">Enable surge</div>
                  <div className="text-xs text-muted-foreground">Multiplies delivery quotes immediately</div>
                </div>
                <button
                  type="button"
                  onClick={() => setActive((a) => !a)}
                  className={`relative h-6 w-11 shrink-0 rounded-full ${active ? "bg-primary" : "bg-border"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-transform ${active ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                </button>
              </label>

              <label className="mt-4 block">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Multiplier</span>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="3"
                  value={mult}
                  onChange={(e) => setMult(e.target.value)}
                  className="mt-2 block w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                />
              </label>

              <label className="mt-4 block">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Reason (shown in quote breakdown)</span>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-2 block w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                />
              </label>

              <button
                onClick={save}
                disabled={saving}
                className="mt-6 w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save surge settings"}
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Peak hours multiplier ({config?.peak_multiplier ?? 1.2}×) applies separately on weekdays 7–9 and 17–20.
            </p>
          </div>
        )}
    </>
  );
}
