import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Desktop: right panel. Mobile: bottom sheet. */
  className?: string;
};

/**
 * TikTok-style side panel: slides from the right on lg+, bottom sheet on mobile.
 */
export function RightDrawer({ open, onClose, title, children, footer, className }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[10080]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close panel"
        onClick={onClose}
      />
      <aside
        className={cn(
          "absolute flex flex-col bg-background text-foreground shadow-2xl",
          "inset-x-0 bottom-0 max-h-[min(78dvh,560px)] rounded-t-3xl animate-in slide-in-from-bottom duration-300",
          "lg:inset-y-0 lg:right-0 lg:left-auto lg:bottom-auto lg:h-full lg:max-h-none lg:w-[380px] lg:rounded-none lg:border-l lg:border-border lg:animate-in lg:slide-in-from-right",
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-muted lg:hidden" />
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <h3 className="font-sans text-lg font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer ? <div className="shrink-0 border-t border-border p-3">{footer}</div> : null}
      </aside>
    </div>,
    document.body,
  );
}
