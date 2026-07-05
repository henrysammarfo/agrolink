import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { JOB_ACCEPT_SECONDS } from "@/lib/delivery-constants";

type Props = {
  deadline: string | null | undefined;
  onExpired?: () => void;
  compact?: boolean;
};

export function JobAcceptCountdown({ deadline, onExpired, compact }: Props) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!deadline) {
      setSecondsLeft(null);
      return;
    }
    const tick = () => {
      const left = Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) onExpired?.();
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [deadline, onExpired]);

  if (!deadline || secondsLeft == null) return null;

  const pct = (secondsLeft / JOB_ACCEPT_SECONDS) * 100;
  const urgent = secondsLeft <= 10;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums ${
          urgent ? "bg-rose-500/20 text-rose-600 animate-pulse" : "bg-amber-500/15 text-amber-700"
        }`}
      >
        <Clock className="h-3 w-3" />
        {secondsLeft}s
      </span>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-14 w-14 place-items-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="none" className="stroke-muted" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            className={urgent ? "stroke-rose-500" : "stroke-emerald-500"}
            strokeWidth="3"
            strokeDasharray={`${pct} 100`}
            strokeLinecap="round"
          />
        </svg>
        <span className={`font-mono text-lg font-bold tabular-nums ${urgent ? "text-rose-600" : ""}`}>
          {secondsLeft}
        </span>
      </div>
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Accept within</div>
        <div className="text-sm font-medium">
          {secondsLeft > 0 ? `${secondsLeft}s or job reassigns` : "Reassigning…"}
        </div>
      </div>
    </div>
  );
}
