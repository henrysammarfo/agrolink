import { processOrderPayouts } from "@/server/payouts";

export async function completeDelivery(deliveryId: string, driverUserId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: delivery } = await supabaseAdmin
    .from("deliveries")
    .select("*, order:orders(*)")
    .eq("id", deliveryId)
    .maybeSingle();

  if (!delivery) throw new Error("Delivery not found");

  const { data: driver } = await supabaseAdmin
    .from("driver_profiles")
    .select("id")
    .eq("user_id", driverUserId)
    .maybeSingle();

  if (!driver || delivery.driver_id !== driver.id) {
    throw new Error("Not assigned to this delivery");
  }

  await supabaseAdmin
    .from("deliveries")
    .update({
      status: "delivered",
      actual_delivery: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", deliveryId);

  const order = delivery.order as { id: string; buyer_id: string };
  await supabaseAdmin
    .from("orders")
    .update({ status: "dispatched", updated_at: new Date().toISOString() })
    .eq("id", order.id);

  const payout = await processOrderPayouts(order.id);

  await supabaseAdmin.from("notifications").insert({
    user_id: order.buyer_id,
    type: "delivery_complete",
    title: "Delivered!",
    body: "Your produce has arrived. Farmer and driver paid via MoMo.",
    link: "/app/buyer/orders",
  });

  return payout;
}
