import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api/fetch-auth";
import { fetchOrderById } from "@/lib/api/orders";
import { LifecycleStepper } from "@/components/order/LifecycleStepper";
import { PAYMENT_TRACKING_STEPS, getPaymentTrackingStep } from "@/lib/order-lifecycle";

export const Route = createFileRoute("/app/buyer/orders/$orderId/payment-callback")({
  validateSearch: (search: Record<string, unknown>): { reference?: string } => {
    const ref =
      (typeof search.reference === "string" && search.reference) ||
      (typeof search.trxref === "string" && search.trxref) ||
      undefined;
    return ref ? { reference: ref } : {};
  },
  head: () => ({ meta: [{ title: "Payment · AgroLink" }] }),
  component: PaymentCallbackPage,
});

function PaymentCallbackPage() {
  const { orderId } = Route.useParams();
  const { reference } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [message, setMessage] = useState("Verifying your payment…");
  const [paymentStep, setPaymentStep] = useState<"initiated" | "pending" | "confirmed">("pending");

  useEffect(() => {
    let cancelled = false;

    async function goToOrder(hasDelivery: boolean) {
      if (cancelled) return;
      setTimeout(() => {
        void navigate({
          to: hasDelivery ? "/app/buyer/orders/$orderId/match" : "/app/buyer/orders/$orderId/success",
          params: { orderId },
          replace: true,
        });
      }, 1200);
    }

    async function verify() {
      try {
        let ok = false;
        let verifyMessage = "";

        if (reference) {
          const res = await apiFetch("/api/payments/verify", {
            method: "POST",
            body: JSON.stringify({ reference }),
          });
          const data = (await res.json()) as { ok?: boolean; message?: string };
          ok = !!data.ok;
          verifyMessage = data.message ?? "";
        } else {
          const res = await apiFetch("/api/orders/verify-payment", {
            method: "POST",
            body: JSON.stringify({ orderId }),
          });
          const data = (await res.json()) as { ok?: boolean; message?: string };
          ok = !!data.ok;
          verifyMessage = data.message ?? "";
        }

        if (cancelled) return;

        if (ok) {
          setStatus("success");
          setMessage("Payment confirmed!");
          setPaymentStep("confirmed");
          if (user?.id) {
            void queryClient.invalidateQueries({ queryKey: ["buyer-orders", user.id] });
            void queryClient.invalidateQueries({ queryKey: ["order-match", orderId] });
            void queryClient.invalidateQueries({ queryKey: ["order-success", orderId] });
          }
          const order = await fetchOrderById(orderId);
          await goToOrder(!!order?.delivery);
          return;
        }

        const order = await fetchOrderById(orderId);
        if (order?.payment_status === "paid") {
          setStatus("success");
          setMessage("Payment already confirmed");
          setPaymentStep("confirmed");
          await goToOrder(!!order.delivery);
          return;
        }

        setStatus("failed");
        setMessage(verifyMessage || "Payment not completed yet.");
        setPaymentStep(getPaymentTrackingStep(order?.payment_status ?? "pending"));
      } catch {
        if (!cancelled) {
          setStatus("failed");
          setMessage("Could not verify payment. Check your orders or try again.");
        }
      }
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [reference, orderId, navigate, user?.id, queryClient]);

  return (
    <AppShell role="buyer" compact>
      <div className="mx-auto max-w-md min-h-[50vh] px-4 py-8">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Payment tracking</p>
          <div className="mt-3">
            <LifecycleStepper steps={PAYMENT_TRACKING_STEPS} currentStepId={paymentStep} />
          </div>
        </div>
        <div className="mt-8 grid place-items-center text-center">
          {status === "verifying" && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">{message}</p>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle2 className="h-12 w-12 text-primary" />
              <h1 className="mt-4 font-serif text-2xl">Payment done</h1>
              <p className="mt-2 text-sm text-muted-foreground">Taking you to driver matching…</p>
            </>
          )}
          {status === "failed" && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <h1 className="mt-4 font-serif text-2xl">Payment pending</h1>
              <p className="mt-2 text-sm text-muted-foreground">{message}</p>
              <button
                type="button"
                onClick={() =>
                  void navigate({ to: "/app/buyer/orders/$orderId/match", params: { orderId }, replace: true })
                }
                className="mt-6 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background"
              >
                Continue to order
              </button>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
