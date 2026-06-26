import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Tractor, ShoppingBasket, Truck, ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/brand/Logo";
import produceHero from "@/assets/produce-hero.jpg";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · AgroLink" },
      { name: "description", content: "Sign in or create an AgroLink account as a farmer, buyer, or transport partner." },
      { property: "og:title", content: "Sign in · AgroLink" },
      { property: "og:description", content: "Pick a role and join the marketplace." },
    ],
  }),
  component: Auth,
});

type Role = "buyer" | "farmer" | "transport";

function Auth() {
  const [role, setRole] = useState<Role>("buyer");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="relative hidden lg:block">
        <img src={produceHero} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-background/60 via-background/40 to-background/80" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <BrandLogo size="md" />
          <div>
            <p className="font-serif text-5xl text-foreground leading-tight">
              "I post in the morning, my tomatoes are sold by noon."
            </p>
            <p className="mt-6 text-sm text-muted-foreground">Kwame Asare — Farmer, Dodowa</p>
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
              ? "Sign in to continue to your marketplace."
              : "Pick your role to get started in under four minutes."}
          </p>

          {mode === "signup" && (
            <div className="mt-8 grid grid-cols-3 gap-2">
              {([
                { k: "buyer", l: "Buyer", icon: ShoppingBasket },
                { k: "farmer", l: "Farmer", icon: Tractor },
                { k: "transport", l: "Transport", icon: Truck },
              ] as const).map((r) => {
                const active = role === r.k;
                return (
                  <button
                    key={r.k}
                    onClick={() => setRole(r.k)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-xs transition ${
                      active
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <r.icon className="h-5 w-5" />
                    {r.l}
                  </button>
                );
              })}
            </div>
          )}

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/app" });
            }}
          >
            {mode === "signup" && (
              <Input label="Full name" placeholder="Ama Mensah" />
            )}
            <Input label="Phone number" placeholder="+233 ..." type="tel" />
            <Input label="Password" placeholder="••••••••" type="password" />

            <button
              type="submit"
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-medium text-background hover:bg-foreground/90"
            >
              {mode === "signin" ? "Sign in" : "Create account"}
              <ArrowRight className="h-4 w-4" />
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

          <Link to="/" className="mt-10 block text-center text-xs text-muted-foreground hover:text-foreground">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

function Input({ label, type = "text", placeholder }: { label: string; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="mt-2 block w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary"
      />
    </label>
  );
}
