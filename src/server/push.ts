/** Push token registration — delegates delivery to comms.ts */

export async function registerPushToken(
  userId: string,
  token: string,
  platform: "web" | "android" | "ios",
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("push_tokens").upsert(
    { user_id: userId, token, platform, updated_at: new Date().toISOString() },
    { onConflict: "user_id,token" },
  );
}

export { notifyUser, notifyDriversOfNewJob, sendChatMessageServer } from "@/server/comms";
