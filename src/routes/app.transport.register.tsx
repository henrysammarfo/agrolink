import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft, Upload, Check, Loader2, Truck, FileText, ShieldCheck, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { TransportGate } from "@/components/app/RoleGate";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api/fetch-auth";
import { useDriverProfile } from "@/hooks/use-marketplace";
import {
  upsertDriverRegistration,
  uploadDriverDocument,
  fetchDriverDocuments,
  REQUIRED_DRIVER_DOCS,
  type DriverDocType,
  isDriverVerified,
} from "@/lib/api/driver-onboarding";

export const Route = createFileRoute("/app/transport/register")({
  head: () => ({ meta: [{ title: "Driver registration · AgroLink" }] }),
  component: DriverRegister,
});

const DOC_LABELS: Record<DriverDocType, string> = {
  drivers_license: "Driver's license (front & back)",
  vehicle_registration: "Vehicle registration (DVLA)",
  insurance: "Valid insurance certificate",
  profile_photo: "Profile photo (clear face)",
  ghana_card: "Ghana Card (front)",
};

function DriverRegister() {
  const { user } = useAuth();
  const { data: existing, refetch } = useDriverProfile(user?.id);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [docs, setDocs] = useState<Partial<Record<DriverDocType, File>>>({});

  const [form, setForm] = useState({
    vehicle_type: "motorcycle",
    plate_number: "",
    capacity: "200kg",
    license_number: "",
    license_expiry: "",
    vehicle_make: "",
    vehicle_model: "",
    vehicle_color: "",
    vehicle_year: new Date().getFullYear(),
    ghana_card_id: "",
    momo_number: "",
  });

  const verified = isDriverVerified(existing ?? null);
  const pendingReview = existing?.verification_status === "submitted" || existing?.verification_status === "under_review";
  const rejected = existing?.verification_status === "rejected";

  async function submitRegistration() {
    if (!user?.id) return;
    setSubmitting(true);
    try {
      if (form.ghana_card_id) {
        const verifyRes = await apiFetch("/api/verify/ghana-card", {
          method: "POST",
          body: JSON.stringify({
            ghanaCardId: form.ghana_card_id,
            fullName: user.email?.split("@")[0],
          }),
        });
        const verify = (await verifyRes.json()) as { verified: boolean; message: string };
        if (verify.verified) {
          toast.success("Ghana Card format accepted — admin will verify");
        } else {
          toast.message("Submitted for admin review", { description: verify.message });
        }
      }

      const profileId = await upsertDriverRegistration(user.id, form);
      for (const docType of REQUIRED_DRIVER_DOCS) {
        const file = docs[docType];
        if (file) await uploadDriverDocument(user.id, profileId, docType, file);
      }
      const uploaded = await fetchDriverDocuments(profileId);
      const missing = REQUIRED_DRIVER_DOCS.filter((d) => !uploaded.find((u) => u.doc_type === d));
      if (missing.length) {
        toast.error("Missing documents", { description: `Upload: ${missing.join(", ")}` });
        return;
      }
      toast.success("Application submitted", {
        description: "Our team reviews documents within 24 hours — like Uber driver onboarding.",
      });
      refetch();
      setStep(3);
    } catch (e) {
      toast.error("Registration failed", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <TransportGate>
      <AppShell role="transport">
        <PageHeader
          eyebrow="Drive with AgroLink"
          title="Driver"
          italic="verification"
          sub="Register your vehicle and upload documents — same flow as Bolt/Uber driver signup."
          action={
            <Link to="/app/transport" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to map
            </Link>
          }
        />

        {verified ? (
          <div className="rounded-3xl border border-emerald-300 bg-emerald-50 p-8 text-center dark:bg-emerald-950/30">
            <ShieldCheck className="mx-auto h-12 w-12 text-emerald-600" />
            <h2 className="mt-4 font-serif text-2xl">You're verified</h2>
            <p className="mt-2 text-sm text-muted-foreground">Go online and accept delivery jobs on the map.</p>
            <Link to="/app/transport" className="mt-6 inline-flex rounded-full bg-emerald-600 px-6 py-3 text-sm text-white">
              Open driver map
            </Link>
          </div>
        ) : pendingReview ? (
          <div className="rounded-3xl border border-amber-300 bg-amber-50 p-8 text-center dark:bg-amber-950/30">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-amber-600" />
            <h2 className="mt-4 font-serif text-2xl">Under review</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Status: {existing?.verification_status}. We verify license, registration, and insurance before approval.
            </p>
          </div>
        ) : (
          <>
            {rejected && existing?.rejection_reason && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm dark:bg-rose-950/30">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                <div>
                  <div className="font-medium">Application rejected</div>
                  <p className="text-muted-foreground">{existing.rejection_reason}</p>
                </div>
              </div>
            )}

            <div className="mb-8 flex gap-2">
              {[1, 2].map((s) => (
                <div
                  key={s}
                  className={`flex-1 rounded-full py-2 text-center text-xs uppercase tracking-widest ${
                    step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s === 1 ? "Vehicle" : "Documents"}
                </div>
              ))}
            </div>

            {step === 1 && (
              <div className="grid gap-6 lg:grid-cols-2">
                <FormSection title="Vehicle details">
                  <SelectField
                    label="Vehicle type"
                    value={form.vehicle_type}
                    onChange={(v) => setForm((f) => ({ ...f, vehicle_type: v }))}
                    options={[
                      ["bicycle", "Bicycle"],
                      ["motorcycle", "Motorcycle / okada"],
                      ["car", "Car / salon"],
                      ["pickup", "Pickup / minivan"],
                      ["truck", "Truck / cold van"],
                    ]}
                  />
                  <Field label="Plate number" value={form.plate_number} onChange={(v) => setForm((f) => ({ ...f, plate_number: v }))} placeholder="GR-1234-20" />
                  <Field label="Capacity" value={form.capacity} onChange={(v) => setForm((f) => ({ ...f, capacity: v }))} placeholder="200kg" />
                  <Field label="Make" value={form.vehicle_make} onChange={(v) => setForm((f) => ({ ...f, vehicle_make: v }))} placeholder="Toyota" />
                  <Field label="Model" value={form.vehicle_model} onChange={(v) => setForm((f) => ({ ...f, vehicle_model: v }))} placeholder="Hilux" />
                  <Field label="Color" value={form.vehicle_color} onChange={(v) => setForm((f) => ({ ...f, vehicle_color: v }))} placeholder="White" />
                  <Field label="Year" type="number" value={String(form.vehicle_year)} onChange={(v) => setForm((f) => ({ ...f, vehicle_year: Number(v) }))} />
                </FormSection>
                <FormSection title="Driver & payout">
                  <Field label="License number" value={form.license_number} onChange={(v) => setForm((f) => ({ ...f, license_number: v }))} />
                  <Field label="License expiry" type="date" value={form.license_expiry} onChange={(v) => setForm((f) => ({ ...f, license_expiry: v }))} />
                  <Field label="Ghana Card ID (GHA-…)" value={form.ghana_card_id} onChange={(v) => setForm((f) => ({ ...f, ghana_card_id: v }))} />
                  <Field label="MoMo number (payouts)" value={form.momo_number} onChange={(v) => setForm((f) => ({ ...f, momo_number: v }))} placeholder="0551234987" />
                  <p className="text-xs text-muted-foreground">
                    Pricing uses vehicle type: motorcycle 1.0×, pickup 1.4×, truck 1.8×. Peak hours 7–9am & 5–8pm add 20%.
                  </p>
                  <button
                    onClick={() => setStep(2)}
                    disabled={!form.plate_number || !form.license_number || !form.ghana_card_id}
                    className="mt-4 w-full rounded-full bg-foreground py-3 text-sm font-medium text-background disabled:opacity-50"
                  >
                    Continue to documents
                  </button>
                </FormSection>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload clear photos or PDFs (max 10MB each). All five documents are required — same as Uber driver verification.
                </p>
                {REQUIRED_DRIVER_DOCS.map((docType) => (
                  <label
                    key={docType}
                    className="flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-card p-4 hover:border-primary/40"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <div className="text-sm font-medium">{DOC_LABELS[docType]}</div>
                        <div className="text-xs text-muted-foreground">
                          {docs[docType]?.name ?? "Tap to upload"}
                        </div>
                      </div>
                    </div>
                    {docs[docType] ? (
                      <Check className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    )}
                    <input
                      type="file"
                      hidden
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setDocs((d) => ({ ...d, [docType]: f }));
                      }}
                    />
                  </label>
                ))}
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setStep(1)} className="flex-1 rounded-full border border-border py-3 text-sm">
                    Back
                  </button>
                  <button
                    onClick={submitRegistration}
                    disabled={submitting || REQUIRED_DRIVER_DOCS.some((d) => !docs[d])}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-sm text-white disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                    Submit for review
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </AppShell>
    </TransportGate>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <h3 className="font-serif text-xl">{title}</h3>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function SelectField({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void; options: [string, string][];
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}
