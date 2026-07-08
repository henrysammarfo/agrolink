import { apiFetch } from "@/lib/api/fetch-auth";
import { supabase } from "@/integrations/supabase/client";

export async function trackProfileView(profileId: string) {
  await apiFetch("/api/profile/view", {
    method: "POST",
    body: JSON.stringify({ profileId }),
  }).catch(() => {});
}

export async function fetchProfileViewers(profileId: string) {
  const { data, error } = await supabase
    .from("profile_views")
    .select(
      "id, viewed_at, viewer:profiles!profile_views_viewer_id_fkey(id, display_name, avatar_url, slug)",
    )
    .eq("profile_id", profileId)
    .order("viewed_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function fetchProfileViewCount(profileId: string): Promise<number> {
  const { count, error } = await supabase
    .from("profile_views")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId);
  if (error) return 0;
  return count ?? 0;
}
