import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import {
  Camera,
  Image as ImageIcon,
  Hash,
  MapPin,
  Tag,
  X,
  Sparkles,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import { createListing, uploadListingMedia } from "@/lib/api/listings";
import { apiFetch } from "@/lib/api/fetch-auth";
import type { CropType } from "@/lib/types/marketplace";

export const Route = createFileRoute("/app/create")({
  head: () => ({ meta: [{ title: "Create · AgroLink" }] }),
  component: Create,
});

const GHANA_LOCATIONS = [
  { name: "Dodowa, Greater Accra", lat: 5.883, lng: -0.089 },
  { name: "Agbogbloshie, Accra", lat: 5.556, lng: -0.223 },
  { name: "Tema, Greater Accra", lat: 5.669, lng: -0.017 },
  { name: "Ada Foah, Greater Accra", lat: 5.783, lng: 0.633 },
  { name: "Afienya, Greater Accra", lat: 5.817, lng: -0.117 },
];

function Create() {
  const { roles, addRole, user, profile } = useAuth();
  const role = roles.includes("farmer")
    ? "farmer"
    : roles.includes("transport")
      ? "transport"
      : "buyer";
  const isFarmer = roles.includes("farmer");
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [locationIdx, setLocationIdx] = useState(0);
  const [posting, setPosting] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [priceAdvice, setPriceAdvice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!price) return;
    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch("/api/moderate", {
          method: "POST",
          body: JSON.stringify({
            action: "price_advice",
            cropType: inferCrop(title),
            region: "Greater Accra",
            myPrice: Number(price),
          }),
        });
        const data = (await res.json()) as { advice: string };
        setPriceAdvice(data.advice);
      } catch {
        /* ignore */
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [price, title]);

  if (!isFarmer) {
    const enableSeller = async () => {
      try {
        await addRole("farmer");
        toast.success("Sell mode enabled", { description: "You can now post produce listings." });
      } catch (error) {
        toast.error("Could not enable sell mode", {
          description: error instanceof Error ? error.message : "Please try again.",
        });
      }
    };

    return (
      <AppShell role={role}>
        <PageHeader eyebrow="Create" title="Switch to" italic="Sell" />
        <div className="rounded-3xl border border-border bg-card p-10 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-4 font-serif text-3xl">Start selling on AgroLink</h2>
          <p className="mt-3 mx-auto max-w-md text-sm text-muted-foreground">
            Same account — just like TikTok Shop. Enable Sell mode to post produce with photo or
            video.
          </p>
          <button
            onClick={enableSeller}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm text-background hover:bg-foreground/90"
          >
            Enable Sell mode
          </button>
        </div>
      </AppShell>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) {
      toast.error("Sign in first");
      return;
    }
    setPosting(true);
    try {
      let imageUrl: string | undefined;
      let videoUrl: string | undefined;
      if (mediaFile) {
        const isVideo = mediaFile.type.startsWith("video/");
        const url = await uploadListingMedia(mediaFile, user.id, isVideo ? "video" : "image");
        if (isVideo) videoUrl = url;
        else imageUrl = url;
      }

      const loc = GHANA_LOCATIONS[locationIdx];
      const hashtagList = tags
        .split(/\s+/)
        .filter(Boolean)
        .map((t) => t.replace(/^#/, ""));

      const listing = await createListing(
        {
          title,
          crop_type: inferCrop(title) as CropType,
          description: caption || undefined,
          price_per_unit: Number(price),
          unit: "kg",
          quantity: Number(qty),
          hashtags: hashtagList,
          location_name: loc.name,
          lat: loc.lat,
          lng: loc.lng,
          image_url: imageUrl,
          video_url: videoUrl,
          organic: hashtagList.some((h) => h.toLowerCase().includes("organic")),
        },
        user.id,
      );

      const modRes = await apiFetch("/api/moderate", {
        method: "POST",
        body: JSON.stringify({
          action: "moderate",
          title,
          description: caption,
          hashtags: hashtagList,
          listingId: listing.id,
        }),
      });
      const mod = (await modRes.json()) as { passed: boolean; reason?: string };

      if (!mod.passed) {
        toast.error("Listing rejected", {
          description: mod.reason ?? "Content violates community rules.",
        });
        navigate({ to: "/app/farmer/listings" });
        return;
      }

      toast.success("Listing posted!", { description: `${title} is now live in the feed.` });
      navigate({ to: "/app/farmer/listings" });
    } catch (error) {
      toast.error("Could not post", {
        description: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setPosting(false);
    }
  }

  const onFile = (file?: File) => {
    if (!file) return;
    if (file.size > 50_000_000) {
      toast.error("File too large", { description: "Max 50MB for video, 5MB for images." });
      return;
    }
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    toast.success("Media attached", { description: file.name });
  };

  return (
    <AppShell role={role}>
      <PageHeader
        eyebrow="Create"
        title="New"
        italic="listing"
        sub="Photo or video · price · quantity · location · post"
      />

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 mb-8 flex items-start gap-3 text-xs text-foreground/80">
        <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p>
          AI checks every post for community rules before it goes live. Keep photos honest and
          prices fair.
        </p>
      </div>

      <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-3xl border-2 border-dashed border-border bg-card aspect-[9/16] sm:aspect-video relative overflow-hidden grid place-items-center text-center p-8">
          {mediaPreview && mediaFile?.type.startsWith("video/") ? (
            <video
              src={mediaPreview}
              className="absolute inset-0 h-full w-full object-cover"
              controls
              muted
            />
          ) : mediaPreview ? (
            <img
              src={mediaPreview}
              alt="Upload preview"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
          {mediaPreview && (
            <div className="scrim-bottom-dark" />
          )}
          <div className="relative z-10">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Camera className="h-7 w-7" />
            </div>
            <h3 className={`mt-5 font-serif text-2xl ${mediaPreview ? "text-white" : ""}`}>
              {mediaPreview ? "Media ready" : "Take photo or video"}
            </h3>
            <p
              className={`mt-2 text-sm ${mediaPreview ? "text-white/80" : "text-muted-foreground"}`}
            >
              Vertical 9:16 works best
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
              >
                <ImageIcon className="h-4 w-4" /> Gallery
              </button>
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-5 py-2.5 text-sm"
              >
                <Camera className="h-4 w-4" /> Camera
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              hidden
              accept="image/*,video/*"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <input
              ref={cameraRef}
              type="file"
              hidden
              accept="image/*,video/*"
              capture="environment"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </div>
        </div>

        <div className="space-y-5">
          <Field label="What is it?">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Vine-ripe tomatoes"
              className={inp}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price per kg (GHS)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                placeholder="12"
                className={inp}
              />
            </Field>
            <Field label="How many kg?">
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                required
                placeholder="80"
                className={inp}
              />
            </Field>
          </div>
          <Field label="Caption (optional)">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              placeholder="Picked this morning…"
              className={`${inp} resize-none`}
            />
          </Field>
          <Field label="Hashtags">
            <div className="relative">
              <Hash className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="organic tomato dodowa"
                className={`${inp} pl-9`}
              />
            </div>
          </Field>
          <Field label="Where?">
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <select
                value={locationIdx}
                onChange={(e) => setLocationIdx(Number(e.target.value))}
                className={`${inp} pl-9`}
              >
                {GHANA_LOCATIONS.map((l, i) => (
                  <option key={l.name} value={i}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </Field>

          {priceAdvice && (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-primary">
                <Tag className="h-4 w-4" />
                <span className="text-xs uppercase tracking-widest">AI price tip</span>
              </div>
              <p className="mt-2 text-sm text-foreground/80">{priceAdvice}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={posting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-60"
          >
            {posting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Checking & posting…
              </>
            ) : (
              "Post listing"
            )}
          </button>
        </div>
      </form>
    </AppShell>
  );
}

function inferCrop(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("tomato")) return "tomato";
  if (t.includes("pepper")) return "pepper";
  if (t.includes("garden egg")) return "garden_egg";
  if (t.includes("okra")) return "okra";
  if (t.includes("onion")) return "onion";
  if (t.includes("cabbage")) return "cabbage";
  if (t.includes("cucumber")) return "cucumber";
  if (t.includes("kontomire") || t.includes("spinach") || t.includes("greens"))
    return "leafy_greens";
  return "other";
}

const inp =
  "block w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
