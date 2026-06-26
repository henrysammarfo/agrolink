import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, Leaf, Users, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import corridor from "@/assets/transport-corridor.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About · AgroLink" },
      { name: "description", content: "AgroLink is built in Accra to reroute Ghana's food supply chain." },
      { property: "og:title", content: "About · AgroLink" },
      { property: "og:description", content: "Our mission, our team, and the Agbogbloshie → Tema corridor." },
      { property: "og:image", content: corridor },
    ],
  }),
  component: About,
});

const TEAM = [
  { name: "Henry Sam Marfo", role: "Founder · Product" },
  { name: "Ama Tetteh", role: "Operations · Accra" },
  { name: "Kojo Sarpong", role: "Engineering · AI matching" },
  { name: "Nana Yaa", role: "Farmer relations" },
];

function About() {
  return (
    <SiteLayout>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0">
          <img src={corridor} alt="Accra farmland corridor" className="h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 py-32 md:px-12 md:py-44">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">About</span>
          <h1 className="mt-3 max-w-4xl font-serif text-5xl md:text-7xl lg:text-8xl text-foreground text-balance">
            Re-routing the Accra
            <span className="italic"> food supply</span>, one harvest at a time.
          </h1>
          <p className="mt-8 max-w-xl text-base md:text-lg text-foreground/80">
            AgroLink is built in Ghana for the Greater Accra corridor — from the farms of
            Dodowa, Afienya and Ada Foah to the kitchens of East Legon, Osu and Tema.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 md:px-12">
        <div className="grid gap-12 md:grid-cols-3">
          {[
            { icon: Leaf, t: "Less waste", d: "30% of Ghana's vegetable harvest never reaches a buyer. We connect them in hours, not days." },
            { icon: Users, t: "Better margins", d: "Cut three middlemen. Farmers earn more, buyers pay less, drivers get steady work." },
            { icon: Sparkles, t: "AI-matched", d: "Claude-powered matching surfaces the right supply to the right kitchen at the right hour." },
          ].map((p) => (
            <div key={p.t}>
              <p.icon className="h-6 w-6 text-primary" />
              <h2 className="mt-5 font-serif text-3xl text-foreground">{p.t}</h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-6 py-24 md:px-12">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-end">
            <div>
              <span className="text-xs uppercase tracking-widest text-muted-foreground">The corridor</span>
              <h2 className="mt-3 font-serif text-4xl md:text-6xl text-foreground">
                Agbogbloshie <span className="italic">→</span> Tema.
              </h2>
              <p className="mt-5 text-muted-foreground">
                Greater Accra moves more than 4,000 tons of vegetables per week through
                a handful of wholesale hubs. AgroLink threads the smaller farms into that
                flow — directly, transparently, with no broker rake.
              </p>
            </div>

            <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-border bg-background">
              {/* Simple corridor illustration */}
              <svg viewBox="0 0 600 380" className="absolute inset-0 h-full w-full">
                <defs>
                  <linearGradient id="route" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="oklch(0.7 0.15 145)" />
                    <stop offset="100%" stopColor="oklch(0.82 0.16 75)" />
                  </linearGradient>
                </defs>
                <path
                  d="M 60 280 C 180 200, 280 320, 380 180 S 540 120, 560 100"
                  stroke="url(#route)"
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray="6 6"
                />
                {[
                  { x: 60, y: 280, label: "Ada Foah" },
                  { x: 220, y: 230, label: "Dodowa" },
                  { x: 360, y: 200, label: "Afienya" },
                  { x: 460, y: 150, label: "Tema" },
                  { x: 560, y: 100, label: "Agbogbloshie" },
                ].map((p) => (
                  <g key={p.label}>
                    <circle cx={p.x} cy={p.y} r="6" fill="oklch(0.7 0.15 145)" />
                    <circle cx={p.x} cy={p.y} r="14" fill="oklch(0.7 0.15 145 / 0.2)" />
                    <text x={p.x + 14} y={p.y + 4} fill="oklch(0.97 0.012 90)" fontSize="12" fontFamily="Inter">
                      {p.label}
                    </text>
                  </g>
                ))}
              </svg>
              <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> Greater Accra · Ghana
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 md:px-12">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Team</span>
        <h2 className="mt-3 font-serif text-4xl md:text-6xl text-foreground">
          Built in Accra, <span className="italic">for Accra</span>.
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((m) => (
            <div key={m.name} className="rounded-3xl border border-border bg-card p-6">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/20 font-serif text-xl text-primary">
                {m.name.split(" ").map((p) => p[0]).join("")}
              </div>
              <h3 className="mt-6 font-serif text-2xl text-foreground">{m.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{m.role}</p>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <Link to="/contact" className="inline-flex items-center gap-2 text-foreground hover:text-primary">
            Work with us <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
