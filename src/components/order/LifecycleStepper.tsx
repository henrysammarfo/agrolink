import { Check } from "lucide-react";

type Step = { id: string; label: string };

type Props = {
  steps: readonly Step[];
  currentStepId: string;
  hint?: (stepId: string) => string | null;
  compact?: boolean;
  showUpcoming?: boolean;
  className?: string;
};

function stepIndex(steps: readonly Step[], id: string): number {
  return steps.findIndex((s) => s.id === id);
}

export function LifecycleStepper({
  steps,
  currentStepId,
  hint,
  compact = false,
  showUpcoming = true,
  className = "",
}: Props) {
  const currentIdx = stepIndex(steps, currentStepId);

  if (compact) {
    return (
      <div className={`flex items-center gap-1 overflow-x-auto pb-1 ${className}`}>
        {steps.map((step, i) => {
          const done = i < currentIdx;
          const active = step.id === currentStepId;
          return (
            <div key={step.id} className="flex shrink-0 items-center">
              <span
                className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : done
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
              {i < steps.length - 1 && <span className="mx-1 text-muted-foreground/40">›</span>}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="hidden sm:flex items-center gap-0">
        {steps.map((step, i) => {
          const done = i < currentIdx;
          const active = step.id === currentStepId;
          const stepHint = hint?.(step.id);
          if (!showUpcoming && i > currentIdx) return null;
          return (
            <div key={step.id} className="flex min-w-0 flex-1 items-center">
              <div className="flex min-w-0 flex-1 flex-col items-center px-0.5">
                <div
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-[10px] font-semibold ${
                    done
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                <span
                  className={`mt-1 text-center text-[9px] uppercase tracking-wide leading-tight ${
                    active ? "font-semibold text-foreground" : done ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
                {active && stepHint && (
                  <span className="mt-0.5 line-clamp-2 text-center text-[10px] text-muted-foreground">{stepHint}</span>
                )}
              </div>
              {i < steps.length - 1 && showUpcoming && (
                <div className={`mx-0.5 h-0.5 min-w-[6px] flex-1 ${i < currentIdx ? "bg-emerald-500" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>

      <ol className="sm:hidden space-y-2 border-l border-border pl-4">
        {steps.map((step, i) => {
          const done = i < currentIdx;
          const active = step.id === currentStepId;
          const upcoming = i > currentIdx;
          if (!showUpcoming && upcoming) return null;
          const stepHint = hint?.(step.id);
          return (
            <li key={step.id} className="relative text-sm">
              <span
                className={`absolute -left-[21px] top-1 grid h-3 w-3 rounded-full ${
                  done ? "bg-emerald-500" : active ? "bg-primary" : "bg-border"
                }`}
              />
              <span className={active ? "font-medium text-foreground" : done ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}>
                {step.label}
              </span>
              {active && stepHint && <p className="text-xs text-muted-foreground">{stepHint}</p>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
