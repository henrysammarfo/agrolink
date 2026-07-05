import { useRef, useState } from "react";
import { ChevronRight } from "lucide-react";

type Props = {
  label: string;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
  tone?: "primary" | "emerald" | "blue";
};

const TONE: Record<NonNullable<Props["tone"]>, string> = {
  primary: "bg-primary text-primary-foreground",
  emerald: "bg-emerald-500 text-white",
  blue: "bg-blue-600 text-white",
};

export function SlideToConfirm({ label, onConfirm, disabled, tone = "primary" }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = useState(0);
  const [busy, setBusy] = useState(false);
  const startX = useRef(0);
  const dragging = useRef(false);

  const maxDrag = () => (trackRef.current?.clientWidth ?? 280) - 56;

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || busy) return;
    dragging.current = true;
    startX.current = e.clientX - dragX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const max = maxDrag();
    setDragX(Math.max(0, Math.min(max, e.clientX - startX.current)));
  };

  const onPointerUp = async () => {
    if (!dragging.current) return;
    dragging.current = false;
    const max = maxDrag();
    if (dragX >= max * 0.85) {
      setBusy(true);
      setDragX(max);
      try {
        await onConfirm();
      } finally {
        setBusy(false);
        setDragX(0);
      }
    } else {
      setDragX(0);
    }
  };

  return (
    <div
      ref={trackRef}
      className={`relative h-14 overflow-hidden rounded-full border border-border bg-muted/80 select-none touch-none ${disabled ? "opacity-50" : ""}`}
    >
      <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-muted-foreground pointer-events-none">
        {busy ? "Confirming…" : label}
      </div>
      <div
        className={`absolute left-1 top-1 grid h-12 w-12 place-items-center rounded-full shadow-lg transition-transform ${TONE[tone]}`}
        style={{ transform: `translateX(${dragX}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="slider"
        aria-valuenow={dragX}
        aria-label={label}
      >
        <ChevronRight className="h-5 w-5" />
      </div>
    </div>
  );
}
