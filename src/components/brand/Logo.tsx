import { Link } from "@tanstack/react-router";

type Props = {
  variant?: "full" | "mark";
  size?: "sm" | "md" | "lg";
  asLink?: boolean;
  className?: string;
};

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="agromark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.16 145)" />
          <stop offset="100%" stopColor="oklch(0.82 0.16 75)" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill="none" stroke="url(#agromark)" strokeWidth="2" />
      {/* leaf */}
      <path
        d="M13 25 C 14 15, 22 13, 28 12 C 27 20, 23 27, 13 25 Z"
        fill="url(#agromark)"
      />
      <path
        d="M14 24 L 25 14"
        stroke="oklch(0.16 0.012 145)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BrandLogo({ variant = "full", size = "md", asLink = true, className = "" }: Props) {
  const sizes = {
    sm: { mark: "h-6 w-6", text: "text-lg" },
    md: { mark: "h-8 w-8", text: "text-2xl" },
    lg: { mark: "h-10 w-10", text: "text-3xl" },
  }[size];

  const content = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <BrandMark className={sizes.mark} />
      {variant === "full" && (
        <span
          className={`font-serif ${sizes.text} leading-none tracking-tight text-foreground`}
        >
          agro<span className="italic text-primary">link</span>
        </span>
      )}
    </span>
  );

  if (!asLink) return content;
  return (
    <Link to="/" className="inline-flex items-center" aria-label="AgroLink home">
      {content}
    </Link>
  );
}
