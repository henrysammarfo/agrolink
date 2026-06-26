import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand/Logo";

const NAV = [
  { to: "/market", label: "Market" },
  { to: "/farmers", label: "Farmers" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
];

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const bg = overlay && !scrolled ? "bg-transparent" : "bg-background/70 backdrop-blur-xl border-b border-border";

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-40 transition-colors duration-500 ${bg}`}>
        <div className="flex items-center justify-between px-6 md:px-12 lg:px-16 py-5 md:py-6">
          <div className="flex items-center gap-10">
            <BrandLogo size="md" />
            <nav className="hidden md:flex items-center gap-7">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className="text-foreground/75 hover:text-foreground text-sm font-light transition-colors duration-200"
                  activeProps={{ className: "text-foreground" }}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/contact"
              className="hidden md:inline text-foreground/75 hover:text-foreground text-sm font-light transition-colors"
            >
              Reach Out
            </Link>
            <Link
              to="/auth"
              className="hidden md:inline-flex items-center rounded-full bg-foreground text-background px-5 py-2 text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              Sign in
            </Link>

            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="md:hidden relative h-10 w-10 flex flex-col items-center justify-center gap-1.5"
            >
              <span className="block h-0.5 w-6 rounded-full bg-foreground transition-transform duration-500 [transition-timing-function:cubic-bezier(0.76,0,0.24,1)]" />
              <span className="block h-0.5 w-4 rounded-full bg-foreground transition-opacity duration-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-700 [transition-timing-function:cubic-bezier(0.76,0,0.24,1)] ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <div className="absolute inset-0 bg-background/95 backdrop-blur-2xl" />
        <div className="relative flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-5">
            <BrandLogo size="md" />
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="relative h-10 w-10 grid place-items-center"
            >
              <span className="absolute h-0.5 w-6 rounded-full bg-foreground rotate-45" />
              <span className="absolute h-0.5 w-6 rounded-full bg-foreground -rotate-45" />
            </button>
          </div>

          <nav className="flex-1 flex flex-col justify-center px-6">
            {[...NAV, { to: "/contact", label: "Reach Out" }].map((n, i) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                style={{
                  transitionDelay: open ? `${150 + i * 80}ms` : "0ms",
                }}
                className={`block border-b border-border py-4 font-serif text-4xl sm:text-5xl text-foreground transition-all duration-700 [transition-timing-function:cubic-bezier(0.76,0,0.24,1)] hover:pl-4 hover:text-primary ${
                  open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="p-6">
            <Link
              to="/auth"
              onClick={() => setOpen(false)}
              style={{ transitionDelay: open ? "550ms" : "0ms" }}
              className={`block w-full rounded-full bg-foreground text-background text-center py-4 font-medium transition-all duration-700 ${
                open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              Sign in to AgroLink
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
