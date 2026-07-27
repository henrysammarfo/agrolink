import { Check } from "lucide-react";
import {
  FULFILLMENT_FLOW,
  type TrackedOrder,
  type FulfillmentStep,
  BUYER_ORDER_PIPELINE,
  pipelineStepHint,
} from "@/lib/types/fulfillment";
import type { OrderRow } from "@/lib/types/marketplace";
import { LifecycleStepper } from "@/components/order/LifecycleStepper";
import { PAYMENT_TRACKING_STEPS, getPaymentTrackingStep } from "@/lib/order-lifecycle";

const STEP_ICONS: Record<FulfillmentStep, typeof Check> = {
  placed: Check,
  confirmed: Check,
  packed: Check,
  shipped: Check,
  in_transit: Check,
  delivered: Check,
};

type Props = {
  order: TrackedOrder;
  sourceOrder?: OrderRow;
  showPayment?: boolean;
  showFullPipeline?: boolean;
};

export function OrderTracker({ order, sourceOrder, showPayment = true, showFullPipeline = true }: Props) {
  const currentIndex = FULFILLMENT_FLOW.findIndex((s) => s.step === order.currentStep);
  const paymentStep = sourceOrder ? getPaymentTrackingStep(sourceOrder.payment_status) : null;

  return (
    <div className="rounded-3xl border border-border bg-card p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-primary/80">{order.id}</div>
          <div className="mt-1 font-serif text-2xl text-foreground">{order.items}</div>
        </div>
        <div className="text-right">
          <div className="font-serif text-3xl text-primary">GHS {order.totalGhs}</div>
        </div>
      </div>

      {showPayment && paymentStep && (
        <div className="mt-5 rounded-2xl border border-border bg-muted/30 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Payment tracking</p>
          <div className="mt-3">
            <LifecycleStepper steps={PAYMENT_TRACKING_STEPS} currentStepId={paymentStep} showUpcoming />
          </div>
        </div>
      )}

      {showFullPipeline && sourceOrder && (
        <div className="mt-5 rounded-2xl border border-border bg-background p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Order status</p>
          <div className="mt-3">
            <LifecycleStepper
              steps={BUYER_ORDER_PIPELINE.filter((s) => !["cart", "delivery_setup", "payment_checkout"].includes(s.id))}
              currentStepId={order.pipelineStep}
              hint={(id) => pipelineStepHint(sourceOrder, id as typeof order.pipelineStep)}
              showUpcoming
            />
          </div>
        </div>
      )}

      {/* Summary progress rail */}
      <div className="mt-6 hidden md:flex items-center">
        {FULFILLMENT_FLOW.map((s, i) => {
          const done = i <= currentIndex;
          const active = i === currentIndex;
          const Icon = STEP_ICONS[s.step];
          return (
            <div key={s.step} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div className={`grid h-9 w-9 place-items-center rounded-full border-2 ${
                  done ? (active ? "bg-primary border-primary text-primary-foreground" : "bg-emerald-500 border-emerald-500 text-white")
                       : "bg-background border-border text-muted-foreground"
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={`mt-2 text-[10px] uppercase tracking-widest ${done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
              </div>
              {i < FULFILLMENT_FLOW.length - 1 && (
                <div className={`mx-1 h-0.5 flex-1 ${i < currentIndex ? "bg-emerald-500" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Event timeline */}
      <ol className="mt-6 space-y-3 border-l border-border pl-5">
        {order.timeline.map((e, i) => {
          const Icon = STEP_ICONS[e.step];
          const last = i === order.timeline.length - 1;
          return (
            <li key={i} className="relative">
              <span className={`absolute -left-[27px] grid h-4 w-4 place-items-center rounded-full ${last ? "bg-primary text-primary-foreground" : "bg-emerald-500 text-white"}`}>
                <Icon className="h-2.5 w-2.5" />
              </span>
              <div className="text-sm">
                <span className="font-medium text-foreground">{e.label}</span>
                <span className="ml-2 text-xs text-muted-foreground">{e.at}{e.by && ` · ${e.by}`}</span>
              </div>
              {e.note && <div className="text-xs text-accent">{e.note}</div>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
