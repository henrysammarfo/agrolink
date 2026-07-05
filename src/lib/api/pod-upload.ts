import { supabase } from "@/integrations/supabase/client";

export async function uploadPodPhoto(file: File, userId: string, deliveryId: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${deliveryId}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("delivery-pod").upload(path, file, {
    upsert: false,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw error;
  const { data } = supabase.storage.from("delivery-pod").getPublicUrl(path);
  return data.publicUrl;
}
