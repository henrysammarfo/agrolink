import { Check } from "lucide-react";
import {
  FARMER_ORDER_STEPS,
  farmerStepHint,
  farmerStepIndex,
  getFarmerStepId,
  type FarmerStepId,
} from "@/lib/farmer-order-flow";
import type { OrderRow } from "@/lib/types/marketplace";

export function FarmerOrderStepper({ order }: { order: OrderRow }) {
  const current = getFarmerStepId(order);
  const currentIdx = farmerStepIndex(current);

  return (
    <div className="mt-4">
      <div className="hidden sm:flex items-center gap-0">
        {FARMER_ORDER_STEPS.map((step, i) => {
          const done = i < currentIdx;
          const active = step.id === current;
          const hint = farmerStepHint(order, step.id as FarmerStepId);
          return (
            <div key={step.id} className="flex min-w-0 flex-1 items-center">
              <div className="flex min-w-0 flex-1 flex-col items-center px-0.5">
                <div
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-[10px] font-semibold ${
                    done
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span
                  className={`mt-1.5 text-center text-[9px] uppercase tracking-wide leading-tight ${
                    active ? "font-semibold text-foreground" : done ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
                {active && hint && (
                  <span className="mt-0.5 line-clamp-2 text-center text-[10px] text-muted-foreground">{hint}</span>
                )}
              </div>
              {i < FARMER_ORDER_STEPS.length - 1 && (
                <div className={`mx-0.5 h-0.5 min-w-[8px] flex-1 ${i < currentIdx ? "bg-emerald-500" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>

      <ol className="sm:hidden space-y-2 border-l border-border pl-4">
        {FARMER_ORDER_STEPS.map((step, i) => {
          const done = i < currentIdx;
          const active = step.id === current;
          const hint = farmerStepHint(order, step.id as FarmerStepId);
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
              {active && hint && <p className="text-xs text-muted-foreground">{hint}</p>}
              {!active && !done && <p className="text-xs text-muted-foreground/60">Upcoming</p>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
