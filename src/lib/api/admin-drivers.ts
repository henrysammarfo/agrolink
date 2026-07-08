import { apiFetch } from "@/lib/api/fetch-auth";

export type AdminDriverDocument = {
  id: string;
  doc_type: string;
  status: string;
  file_url: string;
  signed_url: string | null;
  reviewer_notes: string | null;
  created_at: string;
};

export type AdminDriverApplication = {
  id: string;
  user_id: string;
  vehicle_type: string;
  plate_number: string | null;
  capacity: string | null;
  license_number: string | null;
  license_expiry: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  vehicle_year: number | null;
  ghana_card_id: string | null;
  momo_number: string | null;
  verification_status: string;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  email: string | null;
  profile: {
    display_name: string | null;
    phone: string | null;
    region: string | null;
    slug: string | null;
    avatar_url: string | null;
  } | null;
  documents: AdminDriverDocument[];
};

export async function fetchAdminDrivers(status = "pending"): Promise<AdminDriverApplication[]> {
  const res = await apiFetch(`/api/admin/drivers?status=${encodeURIComponent(status)}`);
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Failed to load driver applications");
  }
  const json = (await res.json()) as { drivers: AdminDriverApplication[] };
  return json.drivers;
}

export async function reviewDriverApplication(
  driverId: string,
  action: "approve" | "reject",
  reason?: string,
): Promise<void> {
  const res = await apiFetch("/api/admin/drivers", {
    method: "POST",
    body: JSON.stringify({ driverId, action, reason }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Review failed");
  }
}
