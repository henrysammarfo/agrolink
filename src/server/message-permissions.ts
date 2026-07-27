/** Message permission checks — followers, delivery trips, message requests */

const ACTIVE_DELIVERY_STATUSES = [
  "requested",
  "driver_assigned",
  "driver_enroute_pickup",
  "picked_up",
  "enroute_delivery",
];

export async function usersFollowEachOther(
  userA: string,
  userB: string,
): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [{ data: profileA }, { data: profileB }] = await Promise.all([
    supabaseAdmin.from("profiles").select("slug").eq("id", userA).maybeSingle(),
    supabaseAdmin.from("profiles").select("slug").eq("id", userB).maybeSingle(),
  ]);

  const checks = await Promise.all([
    profileB?.slug
      ? supabaseAdmin
          .from("follows")
          .select("id")
          .eq("follower_id", userA)
          .eq("farmer_slug", profileB.slug)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    profileA?.slug
      ? supabaseAdmin
          .from("follows")
          .select("id")
          .eq("follower_id", userB)
          .eq("farmer_slug", profileA.slug)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return !!(checks[0].data || checks[1].data);
}

export async function hasActiveDeliveryChat(
  senderId: string,
  receiverId: string,
  orderId?: string,
  deliveryId?: string,
): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  let query = supabaseAdmin
    .from("deliveries")
    .select("id, status, order_id, driver_id, order:orders(buyer_id)")
    .in("status", ACTIVE_DELIVERY_STATUSES);

  if (deliveryId) {
    query = query.eq("id", deliveryId);
  } else if (orderId) {
    query = query.eq("order_id", orderId);
  } else {
    return false;
  }

  const { data: delivery } = await query.maybeSingle();
  if (!delivery) return false;

  const order = delivery.order as unknown as { buyer_id: string } | null;
  const buyerId = order?.buyer_id;
  if (!buyerId || !delivery.driver_id) return false;

  const { data: driver } = await supabaseAdmin
    .from("driver_profiles")
    .select("user_id")
    .eq("id", delivery.driver_id)
    .maybeSingle();

  const driverUserId = driver?.user_id;
  if (!driverUserId) return false;

  const participants = new Set([buyerId, driverUserId]);
  return participants.has(senderId) && participants.has(receiverId);
}

export async function getMessageRequestStatus(
  requesterId: string,
  recipientId: string,
): Promise<"none" | "pending" | "accepted" | "declined" | "blocked"> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("message_requests")
    .select("status")
    .eq("requester_id", requesterId)
    .eq("recipient_id", recipientId)
    .maybeSingle();
  return (data?.status as "pending" | "accepted" | "declined" | "blocked") ?? "none";
}

export async function canSendDirectMessage(
  senderId: string,
  receiverId: string,
  opts?: { orderId?: string; deliveryId?: string },
): Promise<{ allowed: boolean; reason?: string; needsRequest?: boolean }> {
  if (senderId === receiverId) {
    return { allowed: false, reason: "Cannot message yourself" };
  }

  if (await usersFollowEachOther(senderId, receiverId)) {
    return { allowed: true };
  }

  if (await hasActiveDeliveryChat(senderId, receiverId, opts?.orderId, opts?.deliveryId)) {
    return { allowed: true };
  }

  const status = await getMessageRequestStatus(senderId, receiverId);
  if (status === "accepted") return { allowed: true };
  if (status === "blocked" || status === "declined") {
    return { allowed: false, reason: "Message request was declined" };
  }
  if (status === "pending") {
    return { allowed: false, reason: "Waiting for them to accept your message request" };
  }

  // Reverse: if they already sent us a request we haven't answered, allow reply path
  const reverse = await getMessageRequestStatus(receiverId, senderId);
  if (reverse === "accepted") return { allowed: true };

  return { allowed: false, needsRequest: true };
}

export async function createMessageRequest(
  requesterId: string,
  recipientId: string,
  preview: string,
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { notifyUser } = await import("@/server/comms");

  await supabaseAdmin.from("message_requests").upsert(
    {
      requester_id: requesterId,
      recipient_id: recipientId,
      status: "pending",
      preview: preview.slice(0, 200),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "requester_id,recipient_id" },
  );

  const { data: requester } = await supabaseAdmin
    .from("profiles")
    .select("display_name")
    .eq("id", requesterId)
    .maybeSingle();

  await notifyUser(recipientId, {
    type: "message_request",
    title: `${requester?.display_name ?? "Someone"} wants to message you`,
    body: preview.slice(0, 80),
    link: "/app/inbox?tab=requests",
  });
}

export async function acceptMessageRequest(
  recipientId: string,
  requesterId: string,
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { notifyUser } = await import("@/server/comms");

  const { data: req } = await supabaseAdmin
    .from("message_requests")
    .select("preview")
    .eq("requester_id", requesterId)
    .eq("recipient_id", recipientId)
    .maybeSingle();

  await supabaseAdmin
    .from("message_requests")
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("requester_id", requesterId)
    .eq("recipient_id", recipientId);

  if (req?.preview) {
    await supabaseAdmin.from("messages").insert({
      sender_id: requesterId,
      receiver_id: recipientId,
      content: req.preview,
    });
  }

  await notifyUser(requesterId, {
    type: "message_request_accepted",
    title: "Message request accepted",
    body: "You can chat now.",
    link: `/app/inbox/chat/${recipientId}`,
  });
}

export async function declineMessageRequest(
  recipientId: string,
  requesterId: string,
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("message_requests")
    .update({ status: "declined", updated_at: new Date().toISOString() })
    .eq("requester_id", requesterId)
    .eq("recipient_id", recipientId);
}

export async function blockMessageRequest(
  recipientId: string,
  requesterId: string,
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("message_requests")
    .update({ status: "blocked", updated_at: new Date().toISOString() })
    .eq("requester_id", requesterId)
    .eq("recipient_id", recipientId);
}

export async function fetchPendingMessageRequests(recipientId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("message_requests")
    .select("requester_id, preview, created_at, requester:profiles!message_requests_requester_id_fkey(display_name, avatar_url, slug)")
    .eq("recipient_id", recipientId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return data ?? [];
}
