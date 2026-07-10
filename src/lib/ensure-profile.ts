import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

function displayNameFromUser(user: User): string {
  const meta = user.user_metadata ?? {};
  return (
    (meta.display_name as string | undefined)?.trim() ||
    (meta.full_name as string | undefined)?.trim() ||
    (meta.name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "AgroLink user"
  );
}

function avatarFromUser(user: User): string | null {
  const meta = user.user_metadata ?? {};
  return (meta.avatar_url as string | undefined) ?? (meta.picture as string | undefined) ?? null;
}

function usernameFromUser(user: User): string {
  const base = (user.email?.split("@")[0] ?? "user").toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${base}${user.id.slice(0, 4)}`;
}

/** Create a missing profile row — common after Google OAuth if the signup trigger did not run. */
export async function ensureUserProfile(user: User) {
  const { data: existing } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (existing?.id) return existing.id;

  const payload = {
    id: user.id,
    display_name: displayNameFromUser(user),
    avatar_url: avatarFromUser(user),
    username: usernameFromUser(user),
    region: "Greater Accra",
  };

  const { data, error } = await supabase.from("profiles").insert(payload).select("id").single();
  if (error) {
    if (error.message.toLowerCase().includes("duplicate")) {
      return user.id;
    }
    throw error;
  }
  return data.id as string;
}
