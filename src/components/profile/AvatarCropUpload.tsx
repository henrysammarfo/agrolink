import { useCallback, useRef, useState } from "react";
import { Camera, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";
import { cropImageToAvatar, uploadAvatar, AVATAR_OUTPUT_PX } from "@/lib/api/avatar";

type Props = {
  userId: string;
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
};

export function AvatarCropUpload({ userId, currentUrl, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [uploading, setUploading] = useState(false);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const onFile = (file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const save = async () => {
    if (!preview) return;
    setUploading(true);
    try {
      const img = new Image();
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = rej;
        img.src = preview;
      });
      const size = Math.min(img.width, img.height) / zoom;
      const cx = img.width / 2 - offset.x / zoom;
      const cy = img.height / 2 - offset.y / zoom;
      const crop = {
        x: Math.max(0, cx - size / 2),
        y: Math.max(0, cy - size / 2),
        width: Math.min(size, img.width),
        height: Math.min(size, img.height),
      };
      const blob = await cropImageToAvatar(preview, crop);
      const url = await uploadAvatar(blob, userId);
      onUploaded(url);
      setPreview(null);
      toast.success("Profile photo updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [offset]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStart.current) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  }, []);

  const onPointerUp = useCallback(() => {
    dragStart.current = null;
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-full bg-muted ring-2 ring-border">
          {currentUrl ? (
            <img src={currentUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center text-2xl text-muted-foreground">?</span>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:border-primary/40"
          >
            <Camera className="h-4 w-4" /> Change photo
          </button>
          <p className="mt-1 text-xs text-muted-foreground">
            Square crop · {AVATAR_OUTPUT_PX}×{AVATAR_OUTPUT_PX}px
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>

      {preview && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Crop & zoom</p>
          <div
            className="relative mx-auto h-56 w-56 overflow-hidden rounded-full bg-black touch-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <img
              src={preview}
              alt="Crop preview"
              className="absolute left-1/2 top-1/2 max-w-none select-none"
              style={{
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
              }}
              draggable={false}
            />
          </div>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button type="button" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} className="grid h-9 w-9 place-items-center rounded-full border border-border">
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => setZoom((z) => Math.min(3, z + 0.1))} className="grid h-9 w-9 place-items-center rounded-full border border-border">
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="flex-1 rounded-full border border-border py-2.5 text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={uploading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-foreground py-2.5 text-sm text-background disabled:opacity-60"
            >
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
