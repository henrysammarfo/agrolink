import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, Image as ImageIcon, Hash, MapPin, Tag, X, Sparkles, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import produceHero from "@/assets/produce-hero.jpg";

export const Route = createFileRoute("/app/create")({
  head: () => ({ meta: [{ title: "Create · AgroLink" }] }),
  component: Create,
});

function Create() {
  const { roles, addRole } = useAuth();
  const role = roles.includes("farmer") ? "farmer" : roles.includes("transport") ? "transport" : "buyer";
  const isFarmer = roles.includes("farmer");
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("organic tomato dodowa");
  const [posted, setPosted] = useState(false);
  const [media, setMedia] = useState<string | null>(null);
  const [mediaName, setMediaName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isFarmer) {
    const enableSeller = async () => {
      try {
        await addRole("farmer");
        toast.success("Seller mode enabled", { description: "You can now post produce listings." });
        navigate({ to: "/app/create" });
      } catch (error) {
        toast.error("Could not enable seller mode", { description: error instanceof Error ? error.message : "Please try again." });
      }
    };

    return (
      <AppShell role={role}>
        <PageHeader eyebrow="Create" title="Become a" italic="seller" />
        <div className="rounded-3xl border border-border bg-card p-10 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-4 font-serif text-3xl">Add a Farmer / Seller role</h2>
          <p className="mt-3 mx-auto max-w-md text-sm text-muted-foreground">
            Buyers can also sell on AgroLink. Add a seller role to your account to post listings — same login, same profile.
          </p>
          <button onClick={enableSeller} className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm text-background hover:bg-foreground/90">
            Enable seller mode
          </button>
          <button onClick={() => navigate({ to: "/app/settings" })} className="ml-2 mt-6 inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm hover:bg-secondary">
            Account settings
          </button>
        </div>
      </AppShell>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setPosted(true);
    saveCreatedListing({
      id: `L-${Date.now().toString().slice(-5)}`,
      produce: title,
      farmer: "AgroLink Demo",
      farmerSlug: "kwame-asare",
      location: "Dodowa",
      pricePerKg: Number(price),
      quantityKg: Number(qty),
      image: media || produceHero,
      postedHoursAgo: 0,
      views: 0,
      likes: 0,
      comments: [],
      organic: tags.toLowerCase().includes("organic"),
      trending: false,
    });
    toast.success("Listing posted", { description: `${title} is now in your seller catalog.` });
    setTimeout(() => navigate({ to: "/app/farmer/listings" }), 900);
  }

  const onFile = (file?: File) => {
    if (!file) return;
    if (file.size > 3_000_000) {
      toast.error("File too large", { description: "Use an image or short demo file under 3MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setMedia(String(reader.result));
      setMediaName(file.name);
      toast.success("Media attached", { description: file.name });
    };
    reader.onerror = () => toast.error("Upload failed", { description: "Try a different image." });
    reader.readAsDataURL(file);
  };

  return (
    <AppShell role={role}>
      <PageHeader eyebrow="Create" title="New" italic="listing" sub="Post a 10-second video or photo. Set price and quantity. Done." />

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 mb-8 flex items-start gap-3 text-xs text-foreground/80">
        <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5" />
        <p>Posts violating community rules (misleading photos, spoiled produce, fake prices) are automatically removed.</p>
      </div>

      <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        {/* Uploader */}
        <div className="rounded-3xl border-2 border-dashed border-border bg-card aspect-[9/16] sm:aspect-video relative overflow-hidden grid place-items-center text-center p-8">
          {media && <img src={media} alt="Upload preview" className="absolute inset-0 h-full w-full object-cover" />}
          {media && <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20" />}
          <div className="relative z-10">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Camera className="h-7 w-7" />
            </div>
            <h3 className={`mt-5 font-serif text-2xl ${media ? "text-white" : ""}`}>{media ? "Media ready" : "Drop a video or photo"}</h3>
            <p className={`mt-2 text-sm ${media ? "text-white/80" : "text-muted-foreground"}`}>{mediaName || "9:16 vertical works best. Up to 60 seconds."}</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background">
                <ImageIcon className="h-4 w-4" /> Upload
              </button>
              <button type="button" onClick={() => toast.message("Camera demo", { description: "Use Upload in this preview; device camera connects in production." })} className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-5 py-2.5 text-sm">
                <Camera className="h-4 w-4" /> Record
              </button>
            </div>
            <input ref={fileRef} type="file" hidden accept="image/*,video/*" onChange={(e) => onFile(e.target.files?.[0])} />
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-5">
          <Field label="Produce name">
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Vine-ripe tomatoes" className={inp} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price / kg (GHS)">
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="12" className={inp} />
            </Field>
            <Field label="Quantity (kg)">
              <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} required placeholder="80" className={inp} />
            </Field>
          </div>
          <Field label="Caption">
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} placeholder="Picked this morning at sunrise. Sweet, firm, ready for your kitchen 🍅" className={`${inp} resize-none`} />
          </Field>
          <Field label="Hashtags">
            <div className="relative">
              <Hash className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <input value={tags} onChange={(e) => setTags(e.target.value)} className={`${inp} pl-9`} />
            </div>
          </Field>
          <Field label="Pickup location">
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <input defaultValue="Dodowa, Greater Accra" className={`${inp} pl-9`} />
            </div>
          </Field>

          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-primary">
              <Tag className="h-4 w-4" />
              <span className="text-xs uppercase tracking-widest">AI price suggestion</span>
            </div>
            <p className="mt-2 text-sm text-foreground/80">
              Today's wholesale benchmark in Agbogbloshie: <span className="font-medium text-foreground">GHS 11.50 – 13.20 / kg</span>.
              Your <span className="font-medium">GHS {price || "—"}</span> is {Number(price) >= 11.5 && Number(price) <= 13.2 ? "right in range." : "outside the suggested range."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-medium text-background hover:bg-foreground/90">
              {posted ? "Posted ✓" : "Post listing"}
            </button>
            <button type="button" onClick={() => navigate({ to: "/app/farmer" })} className="grid h-12 w-12 place-items-center rounded-full border border-border" aria-label="Cancel">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </form>
    </AppShell>
  );
}

type CreatedListing = {
  id: string;
  produce: string;
  farmer: string;
  farmerSlug: string;
  location: string;
  pricePerKg: number;
  quantityKg: number;
  image: string;
  postedHoursAgo: number;
  views: number;
  likes: number;
  comments: [];
  organic: boolean;
  trending: boolean;
};

function saveCreatedListing(listing: CreatedListing) {
  if (typeof window === "undefined") return;
  const key = "agrolink:created-listings:v1";
  try {
    const current = JSON.parse(localStorage.getItem(key) || "[]") as CreatedListing[];
    localStorage.setItem(key, JSON.stringify([listing, ...current]));
  } catch {
    localStorage.setItem(key, JSON.stringify([listing]));
  }
}

const inp = "block w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
