import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useAuth, type AppRole } from "@/lib/auth";
import { registerForPushNotifications } from "@/lib/push-client";
import { fetchNotificationPrefs, saveNotificationPrefs } from "@/lib/api/settings";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings · AgroLink" }] }),
  component: Settings,
});

function Settings() {
  const [whatsapp, setWhatsapp] = useState(true);
  const [push, setPush] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const { theme, setTheme } = useTheme();
  const { roles, addRole, profile, user } = useAuth();
  const role = roles.includes("admin") ? "admin" : roles.includes("farmer") ? "farmer" : roles.includes("transport") ? "transport" : "buyer";

  useEffect(() => {
    if (!user?.id) return;
    fetchNotificationPrefs(user.id)
      .then((p) => {
        setWhatsapp(p.whatsapp);
        setPush(p.push);
        setMarketing(p.marketing);
      })
      .finally(() => setPrefsLoaded(true));
  }, [user?.id]);

  const persistPref = async (key: "whatsapp" | "push" | "marketing", value: boolean) => {
    if (!user?.id) return;
    try {
      await saveNotificationPrefs(user.id, { [key]: value });
      trackEvent("notification_pref_updated", { key, value });
    } catch {
      toast.error("Could not save preference");
    }
  };

  const onWhatsappToggle = async (enabled: boolean) => {
    setWhatsapp(enabled);
    await persistPref("whatsapp", enabled);
    toast.success(enabled ? "Order updates enabled (email + WhatsApp)" : "External order updates off");
  };

  const onPushToggle = async (enabled: boolean) => {
    setPush(enabled);
    await persistPref("push", enabled);
    if (enabled && user?.id) {
      const ok = await registerForPushNotifications(user.id);
      if (ok) toast.success("Push enabled — you'll get Bolt-style job alerts");
      else toast.error("Allow notifications in browser settings");
    }
  };

  const onMarketingToggle = async (enabled: boolean) => {
    setMarketing(enabled);
    await persistPref("marketing", enabled);
  };

  const enableRole = async (next: Exclude<AppRole, "admin">) => {
    try {
      await addRole(next);
      toast.success(`${next === "transport" ? "Drive" : next === "farmer" ? "Sell" : "Shop"} mode enabled`);
    } catch (error) {
      toast.error("Could not update mode", { description: error instanceof Error ? error.message : "Please try again." });
    }
  };

  return (
    <AppShell role={role}>
      <PageHeader eyebrow="Account" title="Your" italic="settings" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Profile">
          <FieldRow label="Full name" defaultValue={profile?.display_name ?? "Your name"} />
          <FieldRow label="Phone" defaultValue={profile?.phone ?? "+233"} />
          <FieldRow label="Email" defaultValue={user?.email ?? "you@example.com"} />
          <FieldRow label="Location" defaultValue={profile?.region ?? "Greater Accra"} />
        </Card>

        <Card title="Workspaces">
          <p className="text-sm text-muted-foreground mb-4">Like TikTok — one account, switch modes anytime.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {([
              ["buyer", "Shop", "Browse feed and buy produce"],
              ["farmer", "Sell", "Post listings and fulfill orders"],
              ["transport", "Drive", "Accept delivery jobs"],
            ] as const).map(([key, label, desc]) => {
              const active = roles.includes(key);
              return (
                <button key={key} type="button" onClick={() => !active && enableRole(key)} className={`rounded-2xl border p-4 text-left transition ${active ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                  <div className="text-sm font-medium">{label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{active ? "Enabled" : desc}</div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card title="Appearance">
          <Toggle
            label="Dark mode"
            desc="Light theme is the default. Switch to dark for low-light viewing."
            value={theme === "dark"}
            onChange={(v) => setTheme(v ? "dark" : "light")}
          />
        </Card>

        <Card title="Notifications">
          {!prefsLoaded && <p className="text-xs text-muted-foreground">Loading preferences…</p>}
          <Toggle label="Order updates" desc="Email (Resend, free) + WhatsApp (Meta Cloud API, free tier) + push." value={whatsapp} onChange={onWhatsappToggle} />
          <Toggle label="Push notifications" desc="Driver job alerts (Bolt/Yango-style ping)." value={push} onChange={onPushToggle} />
          <Toggle label="Marketing emails" desc="Seasonal produce + drops." value={marketing} onChange={onMarketingToggle} />
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
