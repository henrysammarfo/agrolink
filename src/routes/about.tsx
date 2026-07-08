import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, Leaf, Users, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import corridor from "@/assets/transport-corridor.jpg";
import { CorridorMap, CORRIDOR_PINS, CORRIDOR_ROUTE } from "@/components/map/CorridorMap";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About · AgroLink" },
      { name: "description", content: "AgroLink is built in Accra to reroute Ghana's food supply chain." },
      { property: "og:title", content: "About · AgroLink" },
      { property: "og:description", content: "Our mission and the Greater Accra corridor." },
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
          <img src={corridor} alt="Accra farmland corridor" className="h-full w-full object-cover" />
          <div className="scrim-page-bottom" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 py-32 md:px-12 md:py-44">
          <span className="text-xs uppercase tracking-widest text-foreground/80">About</span>
          <h1 className="mt-3 max-w-4xl font-serif text-5xl md:text-7xl lg:text-8xl text-foreground text-balance drop-shadow-sm">
            Re-routing the Accra <span className="italic">food supply</span>, one harvest at a time.
          </h1>
          <p className="mt-8 max-w-xl text-base md:text-lg text-foreground/90">
            Built in Ghana for the Greater Accra corridor — from the farms of Dodowa, Afienya and Ada Foah
            to the kitchens of East Legon, Osu and Tema.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 md:px-12">
        <div className="grid gap-12 md:grid-cols-3">
          {[
            { icon: Leaf, t: "Less waste", d: "30% of Ghana's vegetable harvest never reaches a buyer. We connect them in hours, not days." },
            { icon: Users, t: "Better margins", d: "Cut three middlemen. Farmers earn more, buyers pay less, drivers get steady work." },
            { icon: Sparkles, t: "AI-matched", d: "Smart matching surfaces the right supply to the right kitchen at the right hour." },
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
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-end">
            <div>
              <span className="text-xs uppercase tracking-widest text-muted-foreground">The corridor</span>
              <h2 className="mt-3 font-serif text-4xl md:text-6xl text-foreground">
                Agbogbloshie <span className="italic">→</span> Tema.
              </h2>
              <p className="mt-5 text-muted-foreground">
                Greater Accra moves more than 4,000 tons of vegetables a week through a handful of wholesale hubs.
                AgroLink threads the smaller farms directly into that flow — no broker rake.
              </p>
              <div className="mt-6 flex flex-wrap gap-4 text-xs">
                <Legend color="#2f7d32" label="Farms" />
                <Legend color="#0b3d2e" label="Hubs" />
                <Legend color="#c46a1a" label="Buyer zones" />
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-border bg-background" style={{ aspectRatio: "16/10" }}>
              <CorridorMap pins={CORRIDOR_PINS} route={CORRIDOR_ROUTE} />
              <div className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
                <MapPin className="h-3 w-3" /> Greater Accra · Ghana
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

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-muted-foreground">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} /> {label}
    </span>
  );
}
