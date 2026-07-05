import { Check, Clock, Package, Truck, MapPin, FileText, User } from "lucide-react";
import {
  FULFILLMENT_FLOW,
  type TrackedOrder,
  type FulfillmentStep,
} from "@/lib/types/fulfillment";

const STEP_ICONS: Record<FulfillmentStep, typeof Check> = {
  placed: Check,
  confirmed: Check,
  packed: Package,
  shipped: Truck,
  in_transit: MapPin,
  delivered: Check,
};

export function OrderTracker({ order }: { order: TrackedOrder }) {
  const currentIndex = FULFILLMENT_FLOW.findIndex((s) => s.step === order.currentStep);

  return (
    <div className="rounded-3xl border border-border bg-card p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-primary/80">{order.id}</div>
          <div className="mt-1 font-serif text-2xl text-foreground">{order.items}</div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><User className="h-3 w-3 text-emerald-600" /> {order.farmer}</span>
            {order.driver && <span className="inline-flex items-center gap-1"><Truck className="h-3 w-3 text-amber-600" /> {order.driver}</span>}
            {order.eta && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3 text-rose-500" /> ETA {order.eta}</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="font-serif text-3xl text-primary">GHS {order.totalGhs}</div>
          <a href={order.receiptUrl} className="mt-1 inline-flex items-center gap-1 text-xs text-accent hover:underline">
            <FileText className="h-3 w-3" /> Receipt
          </a>
        </div>
      </div>

      {/* progress rail */}
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

      {/* timeline */}
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
