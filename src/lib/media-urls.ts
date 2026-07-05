/** Self-hosted / Supabase-only media — blocks third-party CDN URLs in production feed. */

const EXTERNAL_MEDIA = /^(https?:\/\/)?(assets\.mixkit\.co|images\.unsplash\.com|cdn\.pixabay\.com)/i;

const SUPABASE_STORAGE = /supabase\.(co|in)\/storage\//i;

export function isAllowedMediaUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith("/")) return true;
  if (SUPABASE_STORAGE.test(url)) return true;
  if (import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === "true") {
    return !EXTERNAL_MEDIA.test(url) || url.startsWith("/");
  }
  return !EXTERNAL_MEDIA.test(url);
}

export function resolveMediaUrl(url: string | null | undefined, fallback: string): string {
  if (url && isAllowedMediaUrl(url)) return url;
  return fallback;
}

export function resolveVideoUrl(
  videoUrl: string | null | undefined,
  imageUrl: string | null | undefined,
): string | null {
  if (videoUrl && isAllowedMediaUrl(videoUrl)) return videoUrl;
  return null;
}
