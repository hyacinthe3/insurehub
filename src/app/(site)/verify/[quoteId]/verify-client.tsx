"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { FlowError, FlowLoading, FlowShell, Notice, Spinner, useDraft } from "@/components/flow/flow-ui";
import { deleteDraft, getPaymentStatus, issuePolicy, saveDraft } from "@/lib/api";
import { formatRwf } from "@/lib/insurance-data";
import { usePlan } from "@/hooks/use-plan";

export default function VerifyClient({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const { status, draft } = useDraft(quoteId);
  const [phase, setPhase] = useState<"waiting" | "issuing" | "failed">("waiting");
  const [message, setMessage] = useState<string | null>(null);
  const started = useRef(false);

  // Fetch plan from backend API (not hard-coded local list)
  const { planStatus, plan } = usePlan(draft?.planId);
  const categorySlug = plan?.categorySlug;

  useEffect(() => {
    // Wait until both draft and plan are ready before polling
    if (!draft?.paymentReference || started.current || planStatus === "loading") return;
    started.current = true;
    let cancelled = false;
    const reference = draft.paymentReference;

    const poll = async () => {
      for (let attempt = 0; attempt < 20 && !cancelled; attempt += 1) {
        try {
          const result = await getPaymentStatus({ data: { reference } });
          if (cancelled) return;
          if (result.status === "confirmed") {
            setPhase("issuing");
            const issued = await issuePolicy({
              data: { reference, planCode: categorySlug ?? "gen" },
            });
            try {
              await saveDraft({ ...draft, status: "paid" });
            } catch {
              // The policy is already issued server-side; cleanup is best-effort.
            }
            try {
              await deleteDraft(draft.id);
            } catch {
              // Already removed or still referenced by the issued policy.
            }
            router.push(`/policy/${issued.id}`);
            return;
          }
          if (result.status === "failed" || result.status === "invalid") {
            setPhase("failed");
            setMessage(
              result.status === "invalid"
                ? "This payment reference could not be verified, so no policy was created."
                : "The gateway declined the payment. No policy was created and nothing was charged.",
            );
            return;
          }
        } catch {
          if (cancelled) return;
          setPhase("failed");
          setMessage("We lost contact with the gateway while confirming. No policy was created.");
          return;
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
      if (!cancelled) {
        setPhase("failed");
        setMessage("The gateway did not confirm in time. No policy was created — please retry.");
      }
    };

    void poll();
    return () => {
      cancelled = true;
    };
  }, [draft, router, planStatus, categorySlug]);

  if (status === "loading") return <FlowLoading label="Loading payment status…" />;
  if (status === "missing" || !draft)
    return <FlowError title="We couldn't find this payment" body="Start a new quote to continue." />;
  if (!draft.paymentReference)
    return (
      <FlowError
        title="No payment started"
        body="Choose a payment method first."
        to="/companies"
        actionLabel="Back to providers"
      />
    );

  const premium = draft.premium ?? plan?.monthly ?? 0;

  return (
    <FlowShell
      step="payment"
      eyebrow="Step 8 · Verification"
      title={phase === "failed" ? "Payment not confirmed" : "Confirming your payment"}
      description={
        phase === "failed"
          ? "We only issue a policy after our server receives confirmation from the gateway."
          : "We're waiting for the payment gateway to confirm the charge. Keep this page open — it takes a few seconds."
      }
    >
      {phase === "failed" ? (
        <>
          <Notice tone="danger" title="No policy was created" body={message ?? undefined} />
          <div className="surface flex flex-wrap gap-3 p-6">
            <Link
              href={`/pay/${quoteId}`}
              className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand"
            >
              Retry payment
            </Link>
            <Link
              href={`/review/${quoteId}`}
              className="inline-flex items-center rounded-full border border-input px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
            >
              Back to my quote
            </Link>
          </div>
        </>
      ) : (
        <div className="surface flex flex-col items-center gap-3 p-12 text-center">
          <Spinner className="h-6 w-6 text-primary" />
          <p className="font-semibold">
            {phase === "issuing" ? "Payment confirmed — issuing your policy…" : `Verifying ${formatRwf(premium)}`}
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {phase === "issuing"
              ? "Generating your policy number, certificate and documents."
              : "The gateway confirms the charge server-side. We never activate cover on the browser's word alone."}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-success" /> Safe to leave — your quote stays saved either way.
          </p>
        </div>
      )}
    </FlowShell>
  );
}
