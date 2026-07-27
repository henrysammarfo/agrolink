import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Hash, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/AppShell";
import { SellerStudioLayout } from "@/components/seller/SellerStudioLayout";
import { LocationPicker, type MapLocation } from "@/components/map/LocationPicker";
import { useAuth } from "@/lib/auth";
import {
  fetchListingForEdit,
  updateListing,
  uploadListingMedia,
} from "@/lib/api/listings";
import { apiFetch } from "@/lib/api/fetch-auth";
import { unitsForCrop } from "@/lib/crop-units";
import type { CropType } from "@/lib/types/marketplace";

export const Route = createFileRoute("/app/farmer/listings/$listingId/edit")({
  head: () => ({ meta: [{ title: "Edit listing · AgroLink" }] }),
  component: EditListing,
});

const GHANA_LOCATIONS = [
  { name: "Dodowa, Greater Accra", lat: 5.883, lng: -0.089 },
  { name: "Agbogbloshie, Accra", lat: 5.556, lng: -0.223 },
  { name: "Tema, Greater Accra", lat: 5.669, lng: -0.017 },
  { name: "Ada Foah, Greater Accra", lat: 5.783, lng: 0.633 },
  { name: "Afienya, Greater Accra", lat: 5.817, lng: -0.117 },
];

function EditListing() {
  const { listingId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("kg");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [location, setLocation] = useState<MapLocation>(GHANA_LOCATIONS[0]);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const cropType = inferCrop(title) as CropType;
  const unitOptions = unitsForCrop(cropType);

  useEffect(() => {
    if (!user?.id) return;
    fetchListingForEdit(listingId, user.id)
      .then((row) => {
        if (!row) {
          toast.error("Listing not found");
          navigate({ to: "/app/farmer/listings" });
          return;
        }
        setTitle(row.title);
        setPrice(String(row.price_per_unit));
        setQty(String(row.quantity));
        setUnit(row.unit);
        setCaption(row.description ?? "");
        setTags((row.hashtags ?? []).join(" "));
        setLocation({
          name: row.location_name,
          lat: row.lat,
          lng: row.lng,
        });
        setMediaPreview(row.image_url ?? row.video_url ?? null);
      })
      .finally(() => setLoading(false));
  }, [listingId, user?.id, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    try {
      let imageUrl: string | undefined;
      let videoUrl: string | undefined;
      if (mediaFile) {
        const isVideo = mediaFile.type.startsWith("video/");
        const url = await uploadListingMedia(mediaFile, user.id, isVideo ? "video" : "image");
        if (isVideo) videoUrl = url;
        else imageUrl = url;
      }

      const hashtagList = tags
        .split(/\s+/)
        .filter(Boolean)
        .map((t) => t.replace(/^#/, ""));

      await updateListing(listingId, user.id, {
        title,
        crop_type: cropType,
        description: caption || undefined,
        price_per_unit: Number(price),
        unit,
        quantity: Number(qty),
        hashtags: hashtagList,
        location_name: location.name,
        lat: location.lat,
        lng: location.lng,
        ...(imageUrl ? { image_url: imageUrl } : {}),
        ...(videoUrl ? { video_url: videoUrl } : {}),
        organic: hashtagList.some((h) => h.toLowerCase().includes("organic")),
      });

      await apiFetch("/api/moderate", {
        method: "POST",
        body: JSON.stringify({
          action: "moderate",
          title,
          description: caption,
          hashtags: hashtagList,
          listingId,
        }),
      }).catch(() => {});

      toast.success("Listing updated");
      navigate({ to: "/app/farmer/listings" });
    } catch (error) {
      toast.error("Could not save", {
        description: error instanceof Error ? error.message : "Try again",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SellerStudioLayout>
        <div className="grid place-items-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SellerStudioLayout>
    );
  }

  return (
    <SellerStudioLayout>
      <PageHeader eyebrow="Catalog" title="Edit" italic="listing" sub="Update price, stock, or caption." />

        <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-3xl border border-border bg-card aspect-[4/5] relative overflow-hidden">
            {mediaPreview && (
              <img src={mediaPreview} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-black"
              >
                Change photo
              </button>
              <input
                ref={fileRef}
                type="file"
                hidden
                accept="image/*,video/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setMediaFile(f);
                  setMediaPreview(URL.createObjectURL(f));
                }}
              />
            </div>
          </div>

          <div className="space-y-5">
            <Field label="Title">
              <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inp} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={`Price (GHS/${unit})`}>
                <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required className={inp} />
              </Field>
              <Field label="Quantity">
                <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} required className={inp} />
              </Field>
            </div>
            <Field label="Unit">
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className={inp}>
                {unitOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Caption">
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={2} className={`${inp} resize-none`} />
            </Field>
            <Field label="Hashtags">
              <div className="relative">
                <Hash className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <input value={tags} onChange={(e) => setTags(e.target.value)} className={`${inp} pl-9`} />
              </div>
            </Field>
            <Field label="Location">
              <LocationPicker value={location} onChange={setLocation} quickPicks={GHANA_LOCATIONS} />
            </Field>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full bg-foreground py-3.5 text-sm font-medium text-background disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </SellerStudioLayout>
    );
  }
}

function inferCrop(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("tomato")) return "tomato";
  if (t.includes("pepper")) return "pepper";
  if (t.includes("garden egg")) return "garden_egg";
  if (t.includes("okra")) return "okra";
  if (t.includes("onion")) return "onion";
  if (t.includes("kontomire") || t.includes("spinach") || t.includes("greens")) return "leafy_greens";
  return "other";
}

const inp =
  "block w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
