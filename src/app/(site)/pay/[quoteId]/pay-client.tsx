"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, Smartphone } from "lucide-react";
import { useState } from "react";

import {
  Field,
  FlowError,
  FlowLoading,
  FlowShell,
  Notice,
  Spinner,
  inputClass,
  useDraft,
} from "@/components/flow/flow-ui";
import { createGatewayCharge, saveDraft } from "@/lib/api";
import { formatRwf } from "@/lib/insurance-data";
import { cn } from "@/lib/utils";
import { usePlan } from "@/hooks/use-plan";

export default function PayClient({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const { status, draft } = useDraft(quoteId);
  const [method, setMethod] = useState<"momo" | "card">("momo");
  const [account, setAccount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch plan from backend API (not hard-coded local list)
  const { planStatus, plan } = usePlan(draft?.planId);

  if (status === "loading" || (status === "ready" && planStatus === "loading")) return <FlowLoading label="Loading payment…" />;
  if (status === "missing" || !draft)
    return <FlowError title="We couldn't find this quote" body="Start a new quote to continue." />;

  if (planStatus === "missing" || !plan) return <FlowError title="Product unavailable" body="This product is no longer available." />;
  const premium = draft.premium ?? plan.monthly;

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldError(null);
    const digits = account.replace(/\s+/g, "");
    if (!/^[0-9]{8,19}$/.test(digits)) {
      setFieldError(method === "momo" ? "Enter a valid mobile money number." : "Enter a valid card number.");
      return;
    }
    setSubmitting(true);
    try {
      const charge = await createGatewayCharge({
        data: { quoteId, amount: premium, method, account: digits },
      });
      await saveDraft({ ...draft, step: "payment", paymentReference: charge.reference });
      router.push(`/verify/${quoteId}`);
    } catch {
      setSubmitting(false);
      setError("We couldn't reach the payment gateway. No money has left your account — please try again.");
    }
  };

  return (
    <FlowShell
      step="payment"
      eyebrow={`${plan.provider} · ${plan.category}`}
      title="Pay your first premium"
      description="Cover starts only once our server receives confirmation from the payment gateway."
      aside={
        <div className="surface p-6">
          <p className="text-sm text-muted-foreground">Amount due</p>
          <p className="mt-1 text-3xl font-bold tracking-tight">{formatRwf(premium)}</p>
          <p className="text-sm text-muted-foreground">{plan.name}</p>
          <Link
            href={`/checkout/${quoteId}`}
            className="mt-4 inline-flex text-xs font-semibold text-primary hover:underline"
          >
            Back to checkout
          </Link>
        </div>
      }
    >
      {error && <Notice tone="danger" title="Payment could not start" body={error} />}

      <form onSubmit={pay} className="surface space-y-5 p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              { id: "momo", label: "Mobile money", hint: "MTN MoMo / Airtel Money", icon: Smartphone },
              { id: "card", label: "Card", hint: "Visa / Mastercard", icon: CreditCard },
            ] as const
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setMethod(option.id);
                setFieldError(null);
              }}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
                method === option.id ? "border-primary bg-primary/8" : "border-input hover:bg-accent",
              )}
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <option.icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold">{option.label}</span>
                <span className="block text-xs text-muted-foreground">{option.hint}</span>
              </span>
            </button>
          ))}
        </div>

        <Field
          label={method === "momo" ? "Mobile money number" : "Card number"}
          error={fieldError ?? undefined}
          help="Test tip: a number ending in 0 simulates a declined payment."
        >
          <input
            value={account}
            inputMode="numeric"
            maxLength={19}
            onChange={(e) => setAccount(e.target.value)}
            className={inputClass}
            placeholder={method === "momo" ? "078 000 0001" : "4242 4242 4242 4242"}
          />
        </Field>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-brand transition-colors hover:bg-primary/90 disabled:opacity-70"
        >
          {submitting && <Spinner />}
          {submitting ? "Contacting gateway…" : `Pay ${formatRwf(premium)}`}
        </button>
      </form>
    </FlowShell>
  );
}
