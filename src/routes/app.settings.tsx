import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useAuth, type AppRole } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { registerForPushNotifications } from "@/lib/push-client";
import { fetchNotificationPrefs, saveNotificationPrefs } from "@/lib/api/settings";
import { updateProfile } from "@/lib/api/notifications";
import { apiFetch } from "@/lib/api/fetch-auth";
import { AvatarCropUpload } from "@/components/profile/AvatarCropUpload";
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
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");
  const [usernameOk, setUsernameOk] = useState<boolean | null>(null);
  const [publicBookmarks, setPublicBookmarks] = useState(false);
  const [profileViewNotifs, setProfileViewNotifs] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const { theme, setTheme } = useTheme();
  const { roles, addRole, profile, user, refresh } = useAuth();
  const role = roles.includes("admin") ? "admin" : roles.includes("farmer") ? "farmer" : roles.includes("transport") ? "transport" : "buyer";

  useEffect(() => {
    setDisplayName(profile?.display_name ?? "");
    setPhone(profile?.phone ?? "");
    setRegion(profile?.region ?? "Greater Accra");
    setBio(profile?.bio ?? "");
    setUsername((profile as { username?: string })?.username ?? "");
    setAvatarUrl(profile?.avatar_url ?? null);
  }, [profile?.display_name, profile?.phone, profile?.region, profile?.bio, profile?.avatar_url, profile]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("profiles")
      .select("public_bookmarks, profile_view_notifications")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPublicBookmarks(!!data.public_bookmarks);
          setProfileViewNotifs(data.profile_view_notifications !== false);
        }
      });
  }, [user?.id]);

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

  const saveProfile = async () => {
    if (!user?.id) {
      toast.error("Sign in to save your profile");
      return;
    }
    const uname = username.trim().toLowerCase();
    if (uname && !/^[a-z0-9_]{3,30}$/.test(uname)) {
      toast.error("Username: 3–30 chars, letters, numbers, underscore only");
      return;
    }
    if (uname && usernameOk === false) {
      toast.error("Username is already taken");
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile(user.id, {
        display_name: displayName.trim() || null,
        phone: phone.trim() || null,
        region: region.trim() || null,
        bio: bio.trim() || null,
        username: uname || null,
        public_bookmarks: publicBookmarks,
        profile_view_notifications: profileViewNotifs,
      });
      await refresh();
      trackEvent("profile_updated");
      toast.success("Profile saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSavingProfile(false);
    }
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
          {user?.id && (
            <AvatarCropUpload
              userId={user.id}
              currentUrl={avatarUrl}
              onUploaded={(url) => {
                setAvatarUrl(url);
                void refresh();
              }}
            />
          )}
          <FieldRow label="Full name" value={displayName} onChange={setDisplayName} />
          <UsernameField value={username} onChange={setUsername} onAvailability={setUsernameOk} />
          <FieldRow label="Phone" value={phone} onChange={setPhone} placeholder="+233" />
          <FieldRow label="Email" value={user?.email ?? ""} onChange={() => {}} disabled hint="Email is managed by your sign-in provider." />
          <FieldRow label="Location" value={region} onChange={setRegion} placeholder="Greater Accra" />
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Bio</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell buyers about your farm or business"
              className="mt-2 block w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </label>
          <button
            type="button"
            onClick={saveProfile}
            disabled={savingProfile}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-60"
          >
            {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
            Save profile
          </button>
          <div className="space-y-3 pt-2 border-t border-border">
            <Toggle
              label="Public bookmarks"
              desc="Let others see produce you've saved on your public profile."
              value={publicBookmarks}
              onChange={setPublicBookmarks}
            />
            <Toggle
              label="Profile view alerts"
              desc="Get notified when someone views your farmer profile."
              value={profileViewNotifs}
              onChange={setProfileViewNotifs}
            />
          </div>
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
          <FieldRow label="MoMo number" value={phone} onChange={setPhone} placeholder="+233" />
          <FieldRow label="Channel" value="MTN MoMo" onChange={() => {}} disabled />
        </Card>

        <Card title="Security">
          <FieldRow label="Password" value="••••••••••" onChange={() => {}} disabled hint="Use your sign-in provider to change password." />
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

function UsernameField({
  value,
  onChange,
  onAvailability,
}: {
  value: string;
  onChange: (v: string) => void;
  onAvailability: (ok: boolean | null) => void;
}) {
  useEffect(() => {
    const uname = value.trim().toLowerCase();
    if (!uname || uname.length < 3) {
      onAvailability(null);
      return;
    }
    const t = setTimeout(() => {
      apiFetch(`/api/profile/username-check?username=${encodeURIComponent(uname)}`)
        .then((r) => r.json())
        .then((j: { available?: boolean }) => onAvailability(j.available ?? false))
        .catch(() => onAvailability(null));
    }, 400);
    return () => clearTimeout(t);
  }, [value, onAvailability]);

  const uname = value.trim().toLowerCase();
  const valid = !uname || /^[a-z0-9_]{3,30}$/.test(uname);

  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">Username</span>
      <div className="relative mt-2">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())}
          placeholder="yourname"
          maxLength={30}
          className="block w-full rounded-xl border border-border bg-background py-3 pl-8 pr-4 text-sm outline-none focus:border-primary"
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Unique handle — if taken, try another (e.g. attenu122).
        {!valid && uname ? " Invalid format." : ""}
        {uname && valid && usernameOk === true && " Available."}
        {uname && valid && usernameOk === false && " Already taken."}
      </p>
    </label>
  );
}

function FieldRow({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="mt-2 block w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary disabled:opacity-60"
      />
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
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
