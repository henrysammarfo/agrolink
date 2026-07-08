import { supabase } from "@/integrations/supabase/client";

const AVATAR_SIZE = 512;

export async function uploadAvatar(file: Blob, userId: string): Promise<string> {
  const path = `${userId}/avatar.jpg`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    upsert: true,
    contentType: "image/jpeg",
  });
  if (error) throw error;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = `${data.publicUrl}?t=${Date.now()}`;
  const { error: profileErr } = await supabase
    .from("profiles")
    .update({ avatar_url: url, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (profileErr) throw profileErr;
  return url;
}

/** Crop image file to square JPEG blob (512×512) */
export async function cropImageToAvatar(
  imageSrc: string,
  crop: { x: number; y: number; width: number; height: number },
): Promise<Blob> {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(
    img,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Crop failed"))),
      "image/jpeg",
      0.92,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export const AVATAR_OUTPUT_PX = AVATAR_SIZE;
