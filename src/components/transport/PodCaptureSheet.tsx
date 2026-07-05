import { useRef, useState } from "react";
import { Camera, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { uploadPodPhoto } from "@/lib/api/pod-upload";

type Props = {
  open: boolean;
  deliveryId: string;
  userId: string;
  onClose: () => void;
  onComplete: (podPhotoUrl: string) => Promise<void>;
};

export function PodCaptureSheet({ open, deliveryId, userId, onClose, onComplete }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!open) return null;

  const handleFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!file) {
      toast.error("Take a photo of the delivery first");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadPodPhoto(file, userId, deliveryId);
      await onComplete(url);
      setPreview(null);
      setFile(null);
      onClose();
    } catch {
      toast.error("Could not upload proof of delivery");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
      <div
        className="w-full max-h-[85vh] rounded-t-3xl bg-background p-5 shadow-2xl animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl">Proof of delivery</h3>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Fleetbase-style POD — photo the produce at the buyer&apos;s door before completing.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />

        <div className="mt-5 aspect-[4/3] overflow-hidden rounded-2xl border border-dashed border-border bg-muted/30">
          {preview ? (
            <img src={preview} alt="POD preview" className="h-full w-full object-cover" />
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground hover:text-foreground"
            >
              <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-primary">
                <Camera className="h-8 w-8" />
              </span>
              <span className="text-sm font-medium">Tap to capture</span>
            </button>
          )}
        </div>

        <div className="mt-5 flex gap-3">
          {preview && (
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                setFile(null);
                inputRef.current?.click();
              }}
              className="flex-1 rounded-full border border-border py-3 text-sm font-medium"
            >
              Retake
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={!file || uploading}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {uploading ? "Uploading…" : "Complete delivery"}
          </button>
        </div>
      </div>
    </div>
  );
}
