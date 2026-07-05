import { supabase } from "@/integrations/supabase/client";

export type DriverDocType = "drivers_license" | "vehicle_registration" | "insurance" | "profile_photo" | "ghana_card";

export type DriverProfileFull = {
  id: string;
  user_id: string;
  vehicle_type: string;
  plate_number: string | null;
  capacity: string | null;
  available: boolean;
  verification_status: string;
  license_number: string | null;
  license_expiry: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  vehicle_year: number | null;
  ghana_card_id: string | null;
  momo_number: string | null;
  rejection_reason: string | null;
};

export async function fetchDriverProfile(userId: string): Promise<DriverProfileFull | null> {
  const { data } = await supabase.from("driver_profiles").select("*").eq("user_id", userId).maybeSingle();
  return data as DriverProfileFull | null;
}

export async function upsertDriverRegistration(userId: string, input: {
  vehicle_type: string;
  plate_number: string;
  capacity: string;
  license_number: string;
  license_expiry: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_color: string;
  vehicle_year: number;
  ghana_card_id: string;
  momo_number: string;
}) {
  const { data: existing } = await supabase.from("driver_profiles").select("id").eq("user_id", userId).maybeSingle();
  const payload = {
    user_id: userId,
    ...input,
    verification_status: "submitted" as const,
    available: false,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase.from("driver_profiles").update(payload).eq("id", existing.id);
    if (error) throw error;
    return existing.id;
  }
  const { data, error } = await supabase.from("driver_profiles").insert(payload).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function uploadDriverDocument(
  userId: string,
  driverProfileId: string,
  docType: DriverDocType,
  file: File,
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${docType}.${ext}`;
  const { error } = await supabase.storage.from("driver-documents").upload(path, file, { upsert: true });
  if (error) throw error;

  const { data: signed } = await supabase.storage.from("driver-documents").createSignedUrl(path, 3600);
  const fileUrl = signed?.signedUrl ?? path;

  const { error: docErr } = await supabase.from("driver_documents").upsert({
    driver_profile_id: driverProfileId,
    doc_type: docType,
    file_url: path,
    status: "pending",
    updated_at: new Date().toISOString(),
  }, { onConflict: "driver_profile_id,doc_type" });
  if (docErr) throw docErr;
  return fileUrl;
}

export async function fetchDriverDocuments(driverProfileId: string) {
  const { data, error } = await supabase.from("driver_documents").select("*").eq("driver_profile_id", driverProfileId);
  if (error) throw error;
  return data ?? [];
}

export function isDriverVerified(profile: DriverProfileFull | null): boolean {
  return profile?.verification_status === "approved";
}

export const REQUIRED_DRIVER_DOCS: DriverDocType[] = [
  "drivers_license",
  "vehicle_registration",
  "insurance",
  "profile_photo",
  "ghana_card",
];
