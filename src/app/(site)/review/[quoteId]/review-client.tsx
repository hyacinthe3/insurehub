"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  getMarketplaceBrokers,
  getMarketplaceProductQuestions,
  submitQuoteRequest,
  type MarketplaceBroker,
  type QuoteQuestion,
} from "@/lib/api";
import { formatRwf } from "@/lib/insurance-data";
import { questionnaireFor, questionnaireFromServer } from "@/lib/quote-flow";
import { usePlan } from "@/hooks/use-plan";

export default function ReviewClient({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const { status, draft } = useDraft(quoteId);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const [applicationMode, setApplicationMode] = useState<"direct" | "broker">("direct");
  const [brokerId, setBrokerId] = useState("");
  const [brokers, setBrokers] = useState<MarketplaceBroker[]>([]);
  const [brokersLoading, setBrokersLoading] = useState(false);

  const { planStatus, plan } = usePlan(draft?.planId);

  const [serverQuestions, setServerQuestions] = useState<QuoteQuestion[] | null>(null);

  useEffect(() => {
    if (draft?.personal) {
      setName(draft.personal.fullName || "");
      setEmail(draft.personal.email || "");
      setPhone(draft.personal.phone || "");
    }
  }, [draft]);

  // Load the available brokers/agents customers can choose to be assisted by.
  useEffect(() => {
    let cancelled = false;
    setBrokersLoading(true);
    getMarketplaceBrokers()
      .then((list) => {
        if (!cancelled) setBrokers(list);
      })
      .catch(() => {
        if (!cancelled) setBrokers([]);
      })
      .finally(() => {
        if (!cancelled) setBrokersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Use the same backend-managed questionnaire the customer answered on /quote.
  useEffect(() => {
    if (!plan) {
      setServerQuestions(null);
      return;
    }
    let cancelled = false;
    getMarketplaceProductQuestions(plan.id)
      .then((set) => {
        if (!cancelled) setServerQuestions(set.questions);
      })
      .catch(() => {
        if (!cancelled) setServerQuestions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [plan]);

  if (status === "loading" || (status === "ready" && planStatus === "loading"))
    return <FlowLoading label="Loading details…" />;
  if (status === "missing" || !draft)
    return (
      <FlowError
        title="We couldn't find this quote"
        body="The draft may have expired or been completed already."
      />
    );

  if (planStatus === "missing" || !plan)
    return <FlowError title="Product unavailable" body="This product is no longer available." />;

  const questionnaire = questionnaireFromServer(serverQuestions, questionnaireFor(plan.categorySlug));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Full name is required.";
    if (!email.trim() || !email.includes("@")) next.email = "Valid email address is required.";
    if (!phone.trim()) next.phone = "Phone number is required.";
    if (applicationMode === "broker" && !brokerId) next.broker = "Please choose a broker/agent to assist you.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFailure(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const chosenBroker = brokers.find((b) => b.id === brokerId);
      const res = await submitQuoteRequest({
        planId: draft.planId,
        customerName: name.trim(),
        customerEmail: email.trim().toLowerCase(),
        customerPhone: phone.trim(),
        answers: draft.answers,
        brokerId: applicationMode === "broker" ? brokerId : null,
      });
      const query = new URLSearchParams({
        email: email.trim().toLowerCase(),
      });
      if (applicationMode === "broker" && chosenBroker) {
        query.set("broker", chosenBroker.name);
      }
      router.push(`/quote-submitted/${res.id}?${query.toString()}`);
    } catch (err: any) {
      setSubmitting(false);
      setFailure(err?.message || "Failed to submit quote request. Please try again.");
    }
  };

  return (
    <FlowShell
      step="review"
      eyebrow={`${plan.provider} · ${plan.category}`}
      title="Contact Details & Submit"
      description="Provide your details so the insurer can review your application and send you an official quote."
      aside={
        <div className="surface p-6">
          <p className="text-sm text-muted-foreground">Provider</p>
          <p className="mt-1 text-xl font-bold tracking-tight">{plan.provider}</p>
          <p className="mt-1 text-sm text-muted-foreground">{plan.name}</p>

          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Base premium from</dt>
              <dd className="font-semibold">{formatRwf(plan.monthly)}/mo</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Cover limit</dt>
              <dd className="font-semibold">{formatRwf(plan.coverAmount)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Claim speed</dt>
              <dd className="font-semibold">{plan.claimDays}</dd>
            </div>
          </dl>

          <button
            type="submit"
            form="quote-request-form"
            disabled={submitting}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-brand transition-colors hover:bg-primary/90 disabled:opacity-70"
          >
            {submitting ? <Spinner /> : <Send className="h-4 w-4" />}
            {submitting ? "Submitting Request…" : "Submit Quote Request"}
          </button>
          <Link
            href={`/quote/${quoteId}`}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Questionnaire
          </Link>
        </div>
      }
    >
      {failure && <Notice tone="danger" title="Submission failed" body={failure} />}

      <form id="quote-request-form" onSubmit={handleSubmit} className="surface space-y-5 p-6">
        <h2 className="text-lg font-bold">Your Personal Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full Name" error={errors.name}>
            <input
              type="text"
              value={name}
              placeholder="e.g. Jean Damascene"
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Email Address" error={errors.email}>
            <input
              type="email"
              value={email}
              placeholder="name@example.com"
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Phone Number" error={errors.phone}>
            <input
              type="tel"
              value={phone}
              placeholder="+250 788 000 000"
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </form>

      <div className="surface space-y-4 p-6">
        <div>
          <h2 className="text-lg font-bold">How would you like to apply?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Optional — get free assistance from a licensed broker/agent, or apply directly to the insurer.
          </p>
        </div>
        <RadioGroup
          value={applicationMode}
          onValueChange={(value) => {
            setApplicationMode(value === "broker" ? "broker" : "direct");
            if (value !== "broker") setBrokerId("");
            if (errors.broker) setErrors((prev) => ({ ...prev, broker: "" }));
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-input bg-card p-4 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:ring-2 has-[[data-state=checked]]:ring-primary/30">
            <RadioGroupItem value="direct" className="mt-0.5" />
            <span>
              <span className="block text-sm font-semibold">Apply Directly</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                The insurer reviews your application directly — no intermediary involved.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-input bg-card p-4 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:ring-2 has-[[data-state=checked]]:ring-primary/30">
            <RadioGroupItem value="broker" className="mt-0.5" />
            <span>
              <span className="block text-sm font-semibold">Use a Broker / Agent</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                A licensed broker/agent assists you and tracks your application with the insurer.
              </span>
            </span>
          </label>
        </RadioGroup>

        {applicationMode === "broker" && (
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-sm font-medium">Choose a Broker / Agent</p>
            {brokersLoading ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner /> Loading available brokers…
              </p>
            ) : brokers.length === 0 ? (
              <Notice
                tone="info"
                title="No brokers/agents available right now"
                body="You can still apply directly — no assistance selected."
              />
            ) : (
              <RadioGroup value={brokerId} onValueChange={setBrokerId} className="grid gap-2 sm:grid-cols-2">
                {brokers.map((b) => (
                  <label
                    key={b.id}
                    className="flex cursor-pointer items-start gap-3 rounded-2xl border border-input bg-card p-3 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:ring-2 has-[[data-state=checked]]:ring-primary/30"
                  >
                    <RadioGroupItem value={b.id} className="mt-0.5" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{b.name}</span>
                      {b.company && <span className="block truncate text-xs text-muted-foreground">{b.company}</span>}
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        Licensed broker · member since {new Date(b.memberSince).getFullYear()}
                      </span>
                    </span>
                  </label>
                ))}
              </RadioGroup>
            )}
            {errors.broker && <p className="text-xs font-medium text-destructive">{errors.broker}</p>}
          </div>
        )}
      </div>

      <div className="surface overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">Answers Summary</h2>
          <p className="text-sm text-muted-foreground">
            Questionnaire answers attached to this request.
          </p>
        </div>
        <dl className="divide-y divide-border text-sm">
          {questionnaire.questions.map((q) => (
            <div key={q.id} className="flex items-center justify-between gap-4 px-5 py-3">
              <dt className="text-muted-foreground">{q.label}</dt>
              <dd className="font-medium">{draft.answers[q.id] || "—"}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
        No payment is required to submit a quote request. The insurer will review your details and send you an official quote.
      </p>
    </FlowShell>
  );
}
