/** Profile view tracking + notifications */

export async function recordProfileView(
  profileId: string,
  viewerId: string,
): Promise<{ viewCount: number; notified: boolean }> {
  if (profileId === viewerId) {
    return { viewCount: 0, notified: false };
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Dedupe: one view per viewer per 6 hours
  const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const { data: recent } = await supabaseAdmin
    .from("profile_views")
    .select("id")
    .eq("profile_id", profileId)
    .eq("viewer_id", viewerId)
    .gte("viewed_at", since)
    .maybeSingle();

  if (!recent) {
    await supabaseAdmin.from("profile_views").insert({
      profile_id: profileId,
      viewer_id: viewerId,
    });
  }

  const { count } = await supabaseAdmin
    .from("profile_views")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId);

  const viewCount = count ?? 0;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("profile_view_notifications, display_name")
    .eq("id", profileId)
    .maybeSingle();

  let notified = false;
  if (profile?.profile_view_notifications !== false && !recent) {
    const { data: viewer } = await supabaseAdmin
      .from("profiles")
      .select("display_name")
      .eq("id", viewerId)
      .maybeSingle();

    const { notifyUser } = await import("@/server/comms");
    await notifyUser(profileId, {
      type: "profile_view",
      title: `${viewer?.display_name ?? "Someone"} viewed your profile`,
      body: `You have ${viewCount} profile view${viewCount === 1 ? "" : "s"}`,
      link: "/app/profile/views",
    });
    notified = true;
  }

  return { viewCount, notified };
}

export async function fetchProfileViewers(profileId: string, limit = 50) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("profile_views")
    .select("id, viewed_at, viewer:profiles!profile_views_viewer_id_fkey(id, display_name, avatar_url, slug)")
    .eq("profile_id", profileId)
    .order("viewed_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function fetchProfileViewCount(profileId: string): Promise<number> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("profile_views")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId);
  return count ?? 0;
}
