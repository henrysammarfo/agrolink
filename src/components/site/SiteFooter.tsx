import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand/Logo";
import { Instagram, Twitter, Youtube, MessageCircle } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 md:px-12 py-16 md:py-24">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <BrandLogo size="lg" />
            <p className="mt-5 max-w-sm text-sm text-muted-foreground leading-relaxed">
              Fresh produce, delivered across the Greater Accra corridor.
              Built for farmers, buyers, and the drivers between them.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {[Instagram, Twitter, Youtube, MessageCircle].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-10 w-10 place-items-center rounded-full border border-border text-foreground/70 hover:text-foreground hover:border-foreground/40 transition-colors"
                  aria-label="Social link"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <FooterCol
            title="Market"
            links={[
              { to: "/market", label: "Live feed" },
              { to: "/farmers", label: "Farmers" },
              { to: "/pricing", label: "Pricing" },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { to: "/about", label: "About" },
              { to: "/how-it-works", label: "How it works" },
              { to: "/contact", label: "Contact" },
            ]}
          />
          <FooterCol
            title="Account"
            links={[
              { to: "/auth", label: "Sign in" },
              { to: "/app", label: "Dashboard" },
            ]}
          />
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-border pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} AgroLink. Greater Accra · Ghana.
          </p>
          <p className="text-xs text-muted-foreground">
            Built for the GDSS-PSInno AgriTech Innovation Challenge.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { to: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="font-serif text-lg text-foreground">{title}</h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.to}>
            <Link
              to={l.to}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
