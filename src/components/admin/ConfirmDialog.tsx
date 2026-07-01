import { type ReactNode, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type ConfirmTone = "danger" | "success" | "neutral" | "warning";

export function ConfirmDialog({
  open, onOpenChange, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel",
  tone = "neutral", onConfirm, children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  onConfirm: () => Promise<void> | void;
  children?: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const toneClass =
    tone === "danger" ? "bg-rose-600 hover:bg-rose-700 text-white"
    : tone === "success" ? "bg-emerald-600 hover:bg-emerald-700 text-white"
    : tone === "warning" ? "bg-amber-500 hover:bg-amber-600 text-white"
    : "";
  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {title}
          </DialogTitle>
          {description && <DialogDescription className="pt-1 text-sm">{description}</DialogDescription>}
        </DialogHeader>
        {children}
        <DialogFooter className="gap-2">
          <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>{cancelLabel}</Button>
          <Button
            disabled={busy}
            className={toneClass}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
                onOpenChange(false);
              } catch (error) {
                console.error(error);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
