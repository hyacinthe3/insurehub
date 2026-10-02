"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Save } from "lucide-react";
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
import { calculatePremium, getMarketplaceProductQuestions, saveDraft, type QuoteQuestion } from "@/lib/api";
import { formatRwf } from "@/lib/insurance-data";
import { questionnaireFor, questionnaireFromServer } from "@/lib/quote-flow";
import { usePlan } from "@/hooks/use-plan";

export default function QuoteClient({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const { status, draft, setDraft } = useDraft(quoteId);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pricing, setPricing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  // Fetch plan from backend API (not hard-coded local list)
  const { planStatus, plan } = usePlan(draft?.planId);

  const [serverQuestions, setServerQuestions] = useState<QuoteQuestion[] | null>(null);

  useEffect(() => {
    if (draft) setAnswers(draft.answers);
  }, [draft]);

  // Load backend-managed questions (category defaults + insurer product extras).
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

  if (status === "loading" || (status === "ready" && planStatus === "loading")) return <FlowLoading />;
  if (status === "missing" || !draft)
    return (
      <FlowError
        title="We couldn't find this quote"
        body="The draft may have expired or been completed. Start again from a provider's product list."
      />
    );

  if (planStatus === "missing" || !plan)
    return <FlowError title="Product unavailable" body="This product is no longer on the marketplace." />;

  const questionnaire = questionnaireFromServer(serverQuestions, questionnaireFor(plan.categorySlug));

  const set = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: "" }));
    setSaved(false);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    for (const q of questionnaire.questions) {
      const value = (answers[q.id] ?? "").trim();
      if (!value) {
        if (q.required ?? true) next[q.id] = "This answer is required.";
        continue;
      }
      if (q.type === "number") {
        if (!/^\d+$/.test(value)) {
          next[q.id] = "Enter a whole number.";
        } else {
          const num = Number(value);
          const effectiveMin = q.validation?.min ?? 1;
          if (num < effectiveMin)
            next[q.id] =
              effectiveMin === 1
                ? "Enter a number greater than zero."
                : `Enter a value of at least ${effectiveMin}.`;
          else if (q.validation?.max != null && num > q.validation.max)
            next[q.id] = `Enter a value of at most ${q.validation.max}.`;
        }
      } else if (q.type === "date") {
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
          next[q.id] = "Enter a valid date.";
        } else if (q.validation?.min != null && parsed < new Date(Number(q.validation.min))) {
          next[q.id] = `Pick a date on or after ${new Date(Number(q.validation.min)).toLocaleDateString()}.`;
        } else if (q.validation?.max != null && parsed > new Date(Number(q.validation.max))) {
          next[q.id] = `Pick a date on or before ${new Date(Number(q.validation.max)).toLocaleDateString()}.`;
        }
      } else {
        if (q.validation?.minLength != null && value.length < q.validation.minLength)
          next[q.id] = `Use at least ${q.validation.minLength} characters.`;
        else if (q.validation?.maxLength != null && value.length > q.validation.maxLength)
          next[q.id] = `Keep this under ${q.validation.maxLength} characters.`;
        else if (value.length > 120) next[q.id] = "Keep this under 120 characters.";
        else if (q.validation?.pattern) {
          try {
            if (!new RegExp(q.validation.pattern).test(value))
              next[q.id] = "This doesn't match the expected format.";
          } catch {
            // ignore invalid regex provided by the config
          }
        }
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveForLater = async () => {
    try {
      const savedDraft = await saveDraft({ ...draft, answers, step: "questionnaire" });
      setDraft(savedDraft);
      setSaved(true);
    } catch {
      setFailure("We couldn't save your draft. Please try again.");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFailure(null);
    if (!validate()) return;
    setPricing(true);
    try {
      await saveDraft({ ...draft, answers, step: "review" });
      router.push(`/review/${quoteId}`);
    } catch {
      setPricing(false);
      setFailure("We couldn't save your questionnaire answers. Please try again.");
    }
  };

  return (
    <FlowShell
      step="questionnaire"
      eyebrow={`${plan.provider} · ${plan.category}`}
      title={`Quote Request: ${plan.name}`}
      description={questionnaire.intro}
      aside={
        <div className="surface p-5">
          <p className="text-sm text-muted-foreground">Base premium starting at</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{formatRwf(plan.monthly)}/mo</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Your quote will be reviewed by <strong>{plan.provider}</strong>. You will receive an official premium quote for review before paying.
          </p>
          <Link
            href={`/products/${plan.id}`}
            className="mt-4 inline-flex text-xs font-semibold text-primary hover:underline"
          >
            Review product details
          </Link>
        </div>
      }
    >
      {failure && <Notice tone="danger" title="Something went wrong" body={failure} />}
      {saved && (
        <Notice
          tone="success"
          title="Draft saved"
          body="You can close this page and resume from the providers list at any time."
        />
      )}

      <form onSubmit={submit} className="surface space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {questionnaire.questions.map((q) => {
            const required = q.required ?? true;
            const maxLength = q.validation?.maxLength ?? 120;
            return (
              <Field
                key={q.id}
                label={required ? `${q.label} *` : q.label}
                error={errors[q.id]}
                help={q.help}
              >
                {q.type === "select" ? (
                  <select
                    value={answers[q.id] ?? ""}
                    onChange={(e) => set(q.id, e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select…</option>
                    {q.options?.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : q.type === "date" ? (
                  <input
                    type="date"
                    value={answers[q.id] ?? ""}
                    min={
                      q.validation?.min != null
                        ? new Date(Number(q.validation.min)).toISOString().slice(0, 10)
                        : undefined
                    }
                    max={
                      q.validation?.max != null
                        ? new Date(Number(q.validation.max)).toISOString().slice(0, 10)
                        : undefined
                    }
                    onChange={(e) => set(q.id, e.target.value)}
                    className={inputClass}
                  />
                ) : (
                  <input
                    type={q.type === "number" ? "text" : q.type}
                    inputMode={q.type === "number" ? "numeric" : undefined}
                    value={answers[q.id] ?? ""}
                    placeholder={q.placeholder}
                    minLength={q.validation?.minLength}
                    maxLength={maxLength}
                    pattern={q.type === "text" ? q.validation?.pattern : undefined}
                    onChange={(e) => set(q.id, e.target.value)}
                    className={inputClass}
                  />
                )}
              </Field>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 border-t border-border pt-5">
          <button
            type="submit"
            disabled={pricing}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand transition-colors hover:bg-primary/90 disabled:opacity-70"
          >
            {pricing ? <Spinner /> : <ArrowRight className="h-4 w-4" />}
            {pricing ? "Saving answers…" : "Continue to Contact Info"}
          </button>
          <button
            type="button"
            onClick={saveForLater}
            className="inline-flex items-center gap-2 rounded-full border border-input px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
          >
            <Save className="h-4 w-4" />
            Save for later
          </button>
        </div>
      </form>
    </FlowShell>
  );
}
