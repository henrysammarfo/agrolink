import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search, Check, X, Loader2, Truck, FileText, ExternalLink, User,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { AdminGate } from "@/components/app/RoleGate";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  fetchAdminDrivers,
  reviewDriverApplication,
  type AdminDriverApplication,
} from "@/lib/api/admin-drivers";

export const Route = createFileRoute("/app/admin/drivers")({
  head: () => ({ meta: [{ title: "Drivers · Admin · AgroLink" }] }),
  component: AdminDrivers,
});

const DOC_LABELS: Record<string, string> = {
  drivers_license: "Driver's license",
  vehicle_registration: "Vehicle registration",
  insurance: "Insurance",
  profile_photo: "Profile photo",
  ghana_card: "Ghana Card",
};

const STATUS_TONE: Record<string, string> = {
  submitted: "bg-amber-500/15 text-amber-700",
  under_review: "bg-sky-500/15 text-sky-700",
  pending: "bg-muted text-muted-foreground",
  approved: "bg-emerald-500/15 text-emerald-700",
  rejected: "bg-rose-500/15 text-rose-600",
};

function AdminDrivers() {
  const [items, setItems] = useState<AdminDriverApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [pending, setPending] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminDrivers(status);
      setItems(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const needle = q.toLowerCase();
    return items.filter((d) => {
      const hay = [
        d.profile?.display_name,
        d.email,
        d.plate_number,
        d.license_number,
        d.ghana_card_id,
        d.profile?.region,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [items, q]);

  const confirmReview = async () => {
    if (!pending) return;
    if (pending.action === "reject" && !reason.trim()) {
      toast.error("Rejection reason required");
      throw new Error("reason required");
    }
    await reviewDriverApplication(pending.id, pending.action, reason.trim() || undefined);
    toast.success(pending.action === "approve" ? "Driver approved" : "Driver rejected");
    setReason("");
    await load();
  };

  return (
    <AdminGate>
      <AppShell role="admin" compact>
        <PageHeader
          eyebrow="Transport"
          title="Driver"
          italic="applications"
          sub="Review licenses, vehicle docs, and Ghana Card before drivers can go online."
        />

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="inline-flex flex-1 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, plate, license…"
              className="min-w-0 flex-1 bg-transparent outline-none"
            />
          </label>
          <div className="flex gap-1 rounded-full border border-border bg-card p-1">
            {(["pending", "approved", "rejected", "all"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-full px-3 py-1 text-xs capitalize ${
                  status === s ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No driver applications in this queue.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((d) => (
              <DriverCard key={d.id} driver={d} onPending={setPending} />
            ))}
          </div>
        )}

        {pending && (
          <ConfirmDialog
            open={!!pending}
            onOpenChange={(v) => {
              if (!v) {
                setPending(null);
                setReason("");
              }
            }}
            title={pending.action === "approve" ? "Approve driver?" : "Reject application?"}
            description={
              pending.action === "approve"
                ? "They'll be notified and can go online to accept jobs."
                : "The applicant will be notified with your reason."
            }
            confirmLabel={pending.action === "approve" ? "Approve" : "Reject"}
            tone={pending.action === "approve" ? "success" : "danger"}
            onConfirm={confirmReview}
          >
            {pending.action === "reject" && (
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Why is this application being rejected?"
                className="mt-2 w-full rounded-lg border border-border p-2 text-sm"
              />
            )}
          </ConfirmDialog>
        )}
      </AppShell>
    </AdminGate>
  );
}

function DriverCard({
  driver: d,
  onPending,
}: {
  driver: AdminDriverApplication;
  onPending: (p: { id: string; action: "approve" | "reject" }) => void;
}) {
  const docsComplete = d.documents.length >= 5;
  const canReview = d.verification_status === "submitted" || d.verification_status === "under_review" || d.verification_status === "pending";

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          {d.profile?.avatar_url ? (
            <img src={d.profile.avatar_url} alt="" className="h-14 w-14 rounded-2xl object-cover" />
          ) : (
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-muted">
              <User className="h-6 w-6 text-muted-foreground" />
            </span>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`rounded-full px-2.5 py-0.5 uppercase ${STATUS_TONE[d.verification_status] ?? STATUS_TONE.pending}`}>
                {d.verification_status.replace(/_/g, " ")}
              </span>
              {!docsComplete && (
                <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-rose-600">Missing docs</span>
              )}
            </div>
            <h3 className="mt-2 font-serif text-xl">{d.profile?.display_name ?? "Unknown applicant"}</h3>
            <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
              {d.email && <div>{d.email}</div>}
              {d.profile?.region && <div>{d.profile.region}</div>}
              <div>Applied {new Date(d.updated_at).toLocaleString()}</div>
            </div>
          </div>
        </div>

        {canReview && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onPending({ id: d.id, action: "approve" })}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs text-white"
            >
              <Check className="h-3.5 w-3.5" /> Accept
            </button>
            <button
              onClick={() => onPending({ id: d.id, action: "reject" })}
              className="inline-flex items-center gap-1 rounded-full border border-rose-300 px-3 py-1.5 text-xs text-rose-600"
            >
              <X className="h-3.5 w-3.5" /> Reject
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
        <Info label="Vehicle" value={`${d.vehicle_type} · ${d.vehicle_make ?? ""} ${d.vehicle_model ?? ""}`.trim()} icon={Truck} />
        <Info label="Plate" value={d.plate_number ?? "—"} />
        <Info label="Capacity" value={d.capacity ?? "—"} />
        <Info label="License" value={d.license_number ?? "—"} />
        <Info label="License expiry" value={d.license_expiry ? new Date(d.license_expiry).toLocaleDateString() : "—"} />
        <Info label="Ghana Card" value={d.ghana_card_id ?? "—"} />
        <Info label="MoMo" value={d.momo_number ?? "—"} />
      </div>

      {d.documents.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {d.documents.map((doc) => (
            <a
              key={doc.id}
              href={doc.signed_url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${
                doc.signed_url ? "hover:border-primary/40" : "pointer-events-none opacity-50"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              {DOC_LABELS[doc.doc_type] ?? doc.doc_type}
              {doc.signed_url && <ExternalLink className="h-3 w-3 opacity-60" />}
            </a>
          ))}
        </div>
      )}

      {d.rejection_reason && (
        <p className="mt-3 rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-700">
          Rejection reason: {d.rejection_reason}
        </p>
      )}
    </div>
  );
}

function Info({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Truck;
}) {
  return (
    <div className="rounded-xl bg-muted/50 px-3 py-2">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </div>
      <div className="mt-0.5 font-medium capitalize">{value}</div>
    </div>
  );
}
