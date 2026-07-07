import { apiFetch } from "@/lib/api/fetch-auth";

export type NotificationPrefs = {
  whatsapp: boolean;
  push: boolean;
  marketing: boolean;
};

export async function fetchNotificationPrefs(_userId: string): Promise<NotificationPrefs> {
  const res = await apiFetch("/api/settings/notifications");
  if (!res.ok) return { whatsapp: true, push: true, marketing: false };
  return res.json() as Promise<NotificationPrefs>;
}

export async function saveNotificationPrefs(
  _userId: string,
  prefs: Partial<NotificationPrefs>,
): Promise<void> {
  const res = await apiFetch("/api/settings/notifications", {
    method: "POST",
    body: JSON.stringify(prefs),
  });
  if (!res.ok) throw new Error("Could not save notification preferences");
}

export async function uploadChatAttachment(
  file: File,
  userId: string,
): Promise<{ url: string; type: "image" | "video" }> {
  const { supabase } = await import("@/integrations/supabase/client");
  const isVideo = file.type.startsWith("video/");
  const ext = file.name.split(".").pop() ?? (isVideo ? "mp4" : "jpg");
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("chat-attachments").upload(path, file, {
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("chat-attachments").getPublicUrl(path);
  return { url: data.publicUrl, type: isVideo ? "video" : "image" };
}
