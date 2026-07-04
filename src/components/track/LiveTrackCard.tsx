import { useEffect, useState } from "react";
import { Phone, MessageCircle, Shield, Star, Navigation, Clock } from "lucide-react";
import { CorridorMap, TRACK_PINS, TRACK_ROUTE } from "@/components/map/CorridorMap";
import type { TrackedOrder } from "@/lib/mock-data";
import { FULFILLMENT_FLOW } from "@/lib/mock-data";

export function LiveTrackCard({ order }: { order: TrackedOrder }) {
  const [progress, setProgress] = useState(0);
  const currentIndex = FULFILLMENT_FLOW.findIndex((s) => s.step === order.currentStep);

  // fake ETA countdown that eases with progress
  const [etaMin, setEtaMin] = useState(14);
  useEffect(() => {
    setEtaMin(Math.max(1, Math.round(14 * (1 - progress))));
  }, [progress]);

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="relative h-[280px] md:h-[340px]">
        <CorridorMap
          pins={TRACK_PINS}
          route={TRACK_ROUTE}
          animateDriver={!!order.driver}
          driverLabel={order.driver ?? "Driver"}
          onProgress={setProgress}
        />
        {/* Top pill */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center p-4">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-background/95 px-4 py-2 text-xs shadow-lg backdrop-blur">
            <span className="grid h-2 w-2 place-items-center rounded-full bg-emerald-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            </span>
            <span className="font-medium">{order.driver ? "Driver en route" : "Awaiting driver"}</span>
            <span className="text-muted-foreground">·</span>
            <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> {etaMin} min</span>
          </div>
        </div>
      </div>

      {/* Bottom sheet, Uber/Bolt style */}
      <div className="p-5 md:p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary/15 font-serif text-xl text-primary">
            {(order.driver ?? order.farmer)[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-widest text-primary/80">{order.id}</div>
            <div className="truncate font-serif text-xl">{order.driver ?? order.farmer}</div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 text-amber-500"><Star className="h-3 w-3 fill-current" /> 4.9</span>
              <span>·</span>
              <span>Toyota Hilux · GT-4821-22</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="grid h-11 w-11 place-items-center rounded-full bg-emerald-500 text-white hover:bg-emerald-600" aria-label="Call">
              <Phone className="h-4 w-4" />
            </button>
            <button className="grid h-11 w-11 place-items-center rounded-full border border-border text-foreground hover:bg-background" aria-label="Message">
              <MessageCircle className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-background p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Navigation className="h-3 w-3 text-primary" /> Farm → your address</span>
            <span>{Math.round(progress * 100)}% complete</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-primary to-accent transition-[width]"
              style={{ width: `${Math.max(6, progress * 100)}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-6 gap-1">
            {FULFILLMENT_FLOW.map((s, i) => {
              const done = i <= currentIndex;
              return (
                <div key={s.step} className="flex flex-col items-center gap-1">
                  <span className={`h-1.5 w-full rounded-full ${done ? "bg-primary" : "bg-border"}`} />
                  <span className={`text-[9px] uppercase tracking-wider ${done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            <div className="text-muted-foreground">{order.items}</div>
            <div className="mt-0.5 font-serif text-2xl text-primary">GHS {order.totalGhs}</div>
          </div>
          <div className="flex items-center gap-2">
            <a href={order.receiptUrl} className="rounded-full border border-border px-4 py-2 text-xs hover:bg-background">Receipt</a>
            <button className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-4 py-2 text-xs text-rose-600 hover:bg-rose-500/20">
              <Shield className="h-3 w-3" /> Safety
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
