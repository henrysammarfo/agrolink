import { Link } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";

export type DriverCardInfo = {
  displayName: string;
  avatarUrl?: string | null;
  rating?: number | null;
  vehicleType?: string | null;
  vehicleColor?: string | null;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  plateNumber?: string | null;
  slug?: string | null;
  username?: string | null;
  userId?: string | null;
  etaLabel?: string | null;
  phaseLabel?: string | null;
  verified?: boolean;
};

type Props = {
  driver: DriverCardInfo;
  className?: string;
  compact?: boolean;
  dark?: boolean;
};

export function vehicleLabel(d: Pick<DriverCardInfo, "vehicleColor" | "vehicleMake" | "vehicleModel" | "vehicleType">) {
  const parts = [d.vehicleColor, d.vehicleMake, d.vehicleModel].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return d.vehicleType ?? "Vehicle";
}

export function DriverProfileCard({ driver, className = "", compact, dark }: Props) {
  const name = driver.displayName || "Driver";
  const vehicle = vehicleLabel(driver);
  const plate = driver.plateNumber?.trim() || "—";
  const handle = driver.username ?? driver.slug ?? null;
  const initial = name[0]?.toUpperCase() ?? "D";

  return (
    <div
      className={`flex items-center gap-3 ${compact ? "rounded-2xl border border-border bg-muted/40 p-3" : "rounded-2xl border border-border bg-card p-4 shadow-sm"} ${dark ? "border-white/15 bg-white/10 text-white" : ""} ${className}`}
    >
      <div className="relative shrink-0">
        {driver.avatarUrl ? (
          <img
            src={driver.avatarUrl}
            alt=""
            className={`${compact ? "h-12 w-12" : "h-14 w-14"} rounded-full object-cover ring-2 ring-primary/20`}
          />
        ) : (
          <div
            className={`grid ${compact ? "h-12 w-12" : "h-14 w-14"} place-items-center rounded-full bg-primary/15 font-sans text-lg font-bold text-primary`}
          >
            {initial}
          </div>
        )}
        {driver.rating != null && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-background px-1.5 py-0.5 text-[10px] font-semibold shadow dark:bg-black">
            {Number(driver.rating).toFixed(1)}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {handle ? (
          <Link
            to="/app/users/$slug"
            params={{ slug: handle }}
            className="inline-flex max-w-full items-center gap-1 truncate font-sans font-semibold hover:underline"
          >
            <span className="truncate">{name}</span>
            {driver.verified && (
              <BadgeCheck className={`h-4 w-4 shrink-0 ${dark ? "text-emerald-300" : "text-primary"}`} aria-label="Verified driver" />
            )}
          </Link>
        ) : (
          <div className="inline-flex max-w-full items-center gap-1 truncate font-sans font-semibold">
            <span className="truncate">{name}</span>
            {driver.verified && (
              <BadgeCheck className={`h-4 w-4 shrink-0 ${dark ? "text-emerald-300" : "text-primary"}`} aria-label="Verified driver" />
            )}
          </div>
        )}
        <p className={`mt-0.5 truncate text-xs ${dark ? "text-white/70" : "text-muted-foreground"}`}>
          {driver.verified ? "Verified driver · " : ""}
          {vehicle}
          {driver.etaLabel ? ` · ${driver.etaLabel}` : ""}
        </p>
        {driver.phaseLabel && (
          <p className={`mt-0.5 text-[11px] font-medium ${dark ? "text-emerald-300" : "text-primary"}`}>
            {driver.phaseLabel}
          </p>
        )}
      </div>

      <div className={`shrink-0 rounded-xl px-2.5 py-1.5 text-center ${dark ? "bg-white/10" : "bg-muted"}`}>
        <div className="font-mono text-xs font-bold sm:text-sm">{plate}</div>
        <div className="text-[9px] uppercase tracking-widest opacity-60">Plate</div>
      </div>
    </div>
  );
}

export function driverCardFromDeliveryDriver(
  driver: {
    user_id?: string;
    vehicle_type?: string | null;
    plate_number?: string | null;
    vehicle_color?: string | null;
    vehicle_make?: string | null;
    vehicle_model?: string | null;
    rating?: number | null;
    verification_status?: string | null;
    profile?: {
      display_name?: string | null;
      avatar_url?: string | null;
      slug?: string | null;
      username?: string | null;
    } | null;
  } | null | undefined,
  extras?: { etaLabel?: string | null; phaseLabel?: string | null },
): DriverCardInfo | null {
  if (!driver) return null;
  return {
    displayName: driver.profile?.display_name ?? "Driver",
    avatarUrl: driver.profile?.avatar_url,
    rating: driver.rating,
    vehicleType: driver.vehicle_type,
    vehicleColor: driver.vehicle_color,
    vehicleMake: driver.vehicle_make,
    vehicleModel: driver.vehicle_model,
    plateNumber: driver.plate_number,
    slug: driver.profile?.slug,
    username: driver.profile?.username,
    userId: driver.user_id,
    etaLabel: extras?.etaLabel,
    phaseLabel: extras?.phaseLabel,
    verified: driver.verification_status === "approved",
  };
}
