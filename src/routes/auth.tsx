import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand/Logo";
import produceHero from "@/assets/produce-hero.jpg";
import { supabase } from "@/integrations/supabase/client";
import { authRedirectUrl, postAuthRedirectUrl } from "@/lib/auth-redirect";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · AgroLink" },
      { name: "description", content: "Sign in or create an AgroLink account." },
    ],
  }),
  component: Auth,
});

function Auth() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const demoMode = import.meta.env.VITE_DEMO_MODE === "true";

  useEffect(() => {
    if (!user) return;
    // Home rule: For You unless Drive-only or Admin
    const dest = hasRole("admin")
      ? "/app/admin"
      : hasRole("buyer") || hasRole("farmer")
        ? "/app/buyer/feed"
        : hasRole("transport")
          ? "/app/transport"
          : "/app/buyer/feed";
    navigate({ to: dest });
  }, [user, hasRole, navigate]);

  /** Complete Supabase Google OAuth when redirected back with ?code= */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error_description") ?? params.get("error");
    if (oauthError) {
      setErr(decodeURIComponent(oauthError.replace(/\+/g, " ")));
      window.history.replaceState({}, "", "/auth");
      return;
    }

    const code = params.get("code");
    if (!code) return;

    let cancelled = false;
    (async () => {
      setBusy(true);
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (cancelled) return;
      setBusy(false);
      if (error) {
        setErr(error.message);
      } else {
        window.history.replaceState({}, "", "/auth");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  function friendlyAuthError(message: string): string {
    const m = message.toLowerCase();
    if (m.includes("invalid login credentials")) {
      return "Wrong email or password. If you just signed up, confirm your email first.";
    }
    if (m.includes("email not confirmed")) {
      return "Please confirm your email — check your inbox (and spam) for the AgroLink link.";
    }
    if (m.includes("rate limit")) {
      return "Too many attempts. Wait a minute and try again.";
    }
    if (m.includes("invalid") && m.includes("email")) {
      return "That email address was rejected. Try another address (e.g. Gmail).";
    }
    if (m.includes("password") && m.includes("least")) {
      return "Password must be at least 8 characters.";
    }
    return message;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setPendingEmail(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.includes("@")) {
      setErr("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            emailRedirectTo: postAuthRedirectUrl(),
            data: { display_name: name.trim() || trimmedEmail.split("@")[0] },
          },
        });
        if (error) throw error;

        if (!data.session) {
          setPendingEmail(trimmedEmail);
          toast.success("Check your email to confirm your account.");
          setMode("signin");
          return;
        }
        toast.success("Account created — welcome to AgroLink!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (error) throw error;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setErr(friendlyAuthError(msg));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setErr(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: authRedirectUrl("/auth"),
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Google sign-in failed";
      setErr(
        friendlyAuthError(msg) +
          " Ensure Google provider is enabled in Supabase and this site URL is in redirect allowlist.",
      );
      setBusy(false);
    }
  }

  async function demoSignIn(
    demoEmail: string,
    demoPassword: string,
    dest: "/app/buyer/feed" | "/app/farmer" | "/app/admin",
  ) {
    setErr(null);
    setMode("signin");
    setEmail(demoEmail);
    setPassword(demoPassword);
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });
      if (error) throw error;
      navigate({ to: dest });
    } catch (e: unknown) {
      setErr(friendlyAuthError(e instanceof Error ? e.message : "Demo sign-in failed"));
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="relative hidden lg:block">
        <img src={produceHero} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="scrim-auth-panel" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <BrandLogo size="md" className="drop-shadow-md" />
          <div>
            <p className="font-serif text-5xl text-white leading-tight drop-shadow-md">
              "I post in the morning, my tomatoes are sold by noon."
            </p>
            <p className="mt-6 text-sm text-white/80 drop-shadow">Kwame Asare — Farmer, Dodowa</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-10">
            <BrandLogo size="md" />
          </div>

          <h1 className="font-serif text-5xl text-foreground">
            {mode === "signin" ? "Welcome back" : "Join AgroLink"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to shop, sell, or drive — one account for everything."
              : "One account. Shop today, sell tomorrow, drive when you want."}
          </p>

          <button
            type="button"
            onClick={google}
            disabled={busy}
            className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full border border-border bg-card px-5 py-3 text-sm font-medium text-foreground hover:bg-secondary transition disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </button>

          {pendingEmail && (
            <p className="mt-4 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
              We sent a confirmation link to <strong>{pendingEmail}</strong>. Open it, then sign in
              below.
            </p>
          )}

          {demoMode && (
            <>
              <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or try demo{" "}
                <span className="h-px flex-1 bg-border" />
              </div>
              <button
                type="button"
                onClick={() => navigate({ to: "/app/buyer/feed" })}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-5 py-3 text-sm font-medium text-foreground hover:bg-primary/10 transition"
              >
                Explore demo workspace
              </button>
            </>
          )}

          <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> quick demo{" "}
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void demoSignIn("ama-farm@demo.agrolink.app", "AgroLinkDemo!2026", "/app/buyer/feed")}
              className="rounded-full border border-border bg-card px-4 py-3 text-left text-sm transition hover:bg-secondary disabled:opacity-60"
            >
              <span className="block font-semibold text-foreground">Shop feed</span>
              <span className="text-[11px] text-muted-foreground">ama-farm demo</span>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void demoSignIn("ama-farm@demo.agrolink.app", "AgroLinkDemo!2026", "/app/farmer")}
              className="rounded-full border border-border bg-card px-4 py-3 text-left text-sm transition hover:bg-secondary disabled:opacity-60"
            >
              <span className="block font-semibold text-foreground">Sell as farmer</span>
              <span className="text-[11px] text-muted-foreground">ama-farm demo</span>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void demoSignIn("e2e@agrolink.app", "AgroLinkE2e!2026", "/app/admin")}
              className="rounded-full border border-border bg-card px-4 py-3 text-left text-sm transition hover:bg-secondary disabled:opacity-60 sm:col-span-2"
            >
              <span className="block font-semibold text-foreground">Admin / E2E</span>
              <span className="text-[11px] text-muted-foreground">e2e@agrolink.app</span>
            </button>
          </div>

          <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or{" "}
            {mode === "signin" ? "sign in" : "sign up"} with email{" "}
            <span className="h-px flex-1 bg-border" />
          </div>

          <form className="space-y-4" onSubmit={submit}>
            {mode === "signup" && (
              <Input
                label="Full name"
                value={name}
                onChange={setName}
                placeholder="Ama Mensah"
                required
              />
            )}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="At least 8 characters"
              required
            />

            {err && <p className="text-xs text-destructive">{err}</p>}

            <button
              type="submit"
              disabled={busy}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
              {!busy && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New to AgroLink?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>

          <Link
            to="/"
            className="mt-10 block text-center text-xs text-muted-foreground hover:text-foreground"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-2 block w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary"
      />
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09A6.97 6.97 0 0 1 5.46 12c0-.72.13-1.43.38-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
