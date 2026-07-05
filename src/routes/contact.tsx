import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageCircle, Phone, Mail, MapPin, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { submitContactForm } from "@/lib/api/notifications";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact · AgroLink" },
      { name: "description", content: "Talk to the AgroLink team. WhatsApp, phone, and email." },
      { property: "og:title", content: "Contact · AgroLink" },
      { property: "og:description", content: "Get in touch — farmers, buyers, partners." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-6 py-10 md:px-12">
        <header className="max-w-3xl">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Contact</span>
          <h1 className="mt-3 font-serif text-5xl md:text-7xl text-foreground">
            Let's <span className="italic">talk</span>.
          </h1>
          <p className="mt-6 text-base md:text-lg text-muted-foreground">
            Farmer onboarding, buyer accounts, transport partnerships, press — send us a note and
            we'll respond within a business day.
          </p>
        </header>

        <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4">
            {[
              {
                icon: MessageCircle,
                label: "WhatsApp",
                value: "+233 20 000 0000",
                tone: "primary" as const,
              },
              { icon: Phone, label: "Phone", value: "+233 30 000 0000" },
              { icon: Mail, label: "Email", value: "hello@agrolink.gh" },
              { icon: MapPin, label: "Office", value: "Osu, Accra · Ghana" },
            ].map((c) => (
              <a
                key={c.label}
                href="#"
                className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40"
              >
                <span
                  className={`grid h-12 w-12 place-items-center rounded-xl ${c.tone === "primary" ? "bg-primary/20 text-primary" : "bg-foreground/10 text-foreground"}`}
                >
                  <c.icon className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">
                    {c.label}
                  </div>
                  <div className="mt-0.5 font-serif text-xl text-foreground">{c.value}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
              </a>
            ))}
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await submitContactForm(name, email, message);
                setSent(true);
                toast.success("Message sent");
              } catch {
                toast.error("Could not send — try WhatsApp instead");
              }
            }}
            className="rounded-3xl border border-border bg-card p-8 md:p-10"
          >
            <h2 className="font-serif text-3xl text-foreground">Send a message</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <Field label="Name" placeholder="Ama Mensah" value={name} onChange={setName} />
              <Field
                label="Phone or email"
                placeholder="+233 ..."
                value={email}
                onChange={setEmail}
              />
            </div>
            <div className="mt-5">
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  I'm a…
                </span>
                <select className="mt-2 block w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary">
                  <option>Farmer</option>
                  <option>Buyer (restaurant)</option>
                  <option>Buyer (household)</option>
                  <option>Transport partner</option>
                  <option>Press / Partner</option>
                </select>
              </label>
            </div>
            <div className="mt-5">
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  Message
                </span>
                <textarea
                  rows={5}
                  placeholder="Tell us a bit…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-2 block w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
                />
              </label>
            </div>
            <button
              type="submit"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3 text-sm font-medium text-background hover:bg-foreground/90"
            >
              {sent ? "Thanks — we'll reply soon" : "Send message"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </SiteLayout>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="mt-2 block w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary"
      />
    </label>
  );
}
