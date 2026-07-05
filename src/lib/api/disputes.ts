import { supabase } from "@/integrations/supabase/client";

export type DisputeEvent = {
  at: string;
  actor?: string;
  kind?: "opened" | "note" | "evidence" | "status" | "resolved" | "rejected";
  text: string;
  evidenceName?: string;
  evidenceUrl?: string;
};

export type DisputeRow = {
  id: string;
  order_id: string;
  reporter_id: string;
  reason: string;
  description: string | null;
  status: string;
  resolution: string | null;
  events: DisputeEvent[];
  created_at: string;
  order?: { id: string; total_amount: number; buyer_id: string };
  reporter?: { display_name: string | null };
};

export async function fetchDisputes(): Promise<DisputeRow[]> {
  const { data, error } = await supabase
    .from("disputes")
    .select("*, order:orders(id, total_amount, buyer_id), reporter:profiles!disputes_reporter_id_fkey(display_name)")
    .order("created_at", { ascending: false });
  if (error) {
    const { data: fallback, error: fbErr } = await supabase
      .from("disputes")
      .select("*")
      .order("created_at", { ascending: false });
    if (fbErr) throw fbErr;
    return (fallback ?? []) as DisputeRow[];
  }
  return (data ?? []) as DisputeRow[];
}

export async function updateDisputeStatus(
  id: string,
  status: string,
  resolution?: string,
  note?: string,
  actor = "Admin",
) {
  const { data: existing } = await supabase.from("disputes").select("events").eq("id", id).single();
  const kind =
    status === "resolved" ? "resolved" : status === "closed" ? "rejected" : "status";
  const events = [
    ...((existing?.events as DisputeEvent[]) ?? []),
    {
      at: new Date().toISOString(),
      actor,
      kind,
      text: note ?? resolution ?? status,
    },
  ];
  const { error } = await supabase
    .from("disputes")
    .update({
      status,
      resolution,
      events,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function appendDisputeNote(id: string, text: string, actor = "Admin") {
  const { data: existing } = await supabase.from("disputes").select("events").eq("id", id).single();
  const events = [
    ...((existing?.events as DisputeEvent[]) ?? []),
    { at: new Date().toISOString(), actor, kind: "note" as const, text },
  ];
  const { error } = await supabase
    .from("disputes")
    .update({ events, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function createDispute(orderId: string, reporterId: string, reason: string, description?: string) {
  const { error } = await supabase.from("disputes").insert({
    order_id: orderId,
    reporter_id: reporterId,
    reason,
    description,
    events: [{ at: new Date().toISOString(), note: "Dispute opened" }],
  });
  if (error) throw error;
}
