"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, FileUp, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Field,
  FlowError,
  FlowLoading,
  FlowShell,
  Notice,
  inputClass,
  useDraft,
} from "@/components/flow/flow-ui";
import { saveDraft } from "@/lib/api";
import { formatRwf } from "@/lib/insurance-data";
import { emptyPersonal, type PersonalDetails } from "@/lib/quote-flow";
import { usePlan } from "@/hooks/use-plan";

const requiredDocs = ["National ID or passport", "Proof of ownership / supporting document"];

export default function CheckoutClient({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const { status, draft, setDraft } = useDraft(quoteId);

  const [personal, setPersonal] = useState<PersonalDetails>(emptyPersonal);
  const [documents, setDocuments] = useState<string[]>([]);
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  // Fetch plan from backend API (not hard-coded local list)
  const { planStatus, plan } = usePlan(draft?.planId);

  useEffect(() => {
    if (draft) {
      setPersonal(draft.personal);
      setDocuments(draft.documents);
      setTerms(draft.termsAccepted);
    }
  }, [draft]);

  if (status === "loading" || (status === "ready" && planStatus === "loading")) return <FlowLoading label="Loading your checkout…" />;
  if (status === "missing" || !draft)
    return <FlowError title="We couldn't find this quote" body="Start a new quote to continue." />;

  if (planStatus === "missing" || !plan) return <FlowError title="Product unavailable" body="This product is no longer available." />;
  const premium = draft.premium ?? plan.monthly;

  const set = (key: keyof PersonalDetails, value: string) => {
    setPersonal((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setSaved(false);
  };

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    const names = Array.from(files)
      .filter((f) => f.size <= 8 * 1024 * 1024)
      .map((f) => f.name.slice(0, 80));
    const rejected = Array.from(files).length - names.length;
    setDocuments((prev) => Array.from(new Set([...prev, ...names])).slice(0, 6));
    setErrors((prev) => ({
      ...prev,
      documents: rejected > 0 ? `${rejected} file(s) were over the 8MB limit and were skipped.` : "",
    }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (personal.fullName.trim().length < 3) next.fullName = "Enter your full legal name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(personal.email.trim())) next.email = "Enter a valid email address.";
    if (!/^[0-9+\s]{9,15}$/.test(personal.phone.trim())) next.phone = "Enter a valid phone number.";
    if (personal.nationalId.trim().length < 6) next.nationalId = "Enter your ID or passport number.";
    if (personal.address.trim().length < 4) next.address = "Enter your address.";
    if (documents.length === 0) next.documents = "Upload at least one supporting document.";
    if (!terms) next.terms = "You must accept the terms to continue.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const persist = (step: "checkout" | "payment") =>
    saveDraft({ ...draft, personal, documents, termsAccepted: terms, step, status: "accepted" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFailure(null);
    if (!validate()) return;
    try {
      await persist("payment");
      router.push(`/pay/${quoteId}`);
    } catch {
      setFailure("We couldn't save your details. Please try again.");
    }
  };

  const saveForLater = async () => {
    setFailure(null);
    try {
      const savedDraft = await persist("checkout");
      setDraft(savedDraft);
      setSaved(true);
    } catch {
      setFailure("We couldn't save your progress. Please try again.");
    }
  };

  return (
    <FlowShell
      step="checkout"
      eyebrow={`${plan.provider} · ${plan.category}`}
      title="Confirm your details"
      description="These details go on your policy schedule and certificate. Everything is saved as you go."
      aside={
        <div className="surface p-6">
          <p className="text-sm text-muted-foreground">Paying today</p>
          <p className="mt-1 text-3xl font-bold tracking-tight">{formatRwf(premium)}</p>
          <p className="text-sm text-muted-foreground">first monthly premium</p>
          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Product</dt>
              <dd className="text-right font-semibold">{plan.name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Insurer</dt>
              <dd className="font-semibold">{plan.provider}</dd>
            </div>
          </dl>
          <Link
            href={`/review/${quoteId}`}
            className="mt-4 inline-flex text-xs font-semibold text-primary hover:underline"
          >
            Back to quote
          </Link>
        </div>
      }
    >
      {failure && <Notice tone="danger" title="Could not save" body={failure} />}
      {saved && <Notice tone="success" title="Progress saved" body="Resume any time from the providers page." />}

      <form onSubmit={submit} className="space-y-6">
        <div className="surface space-y-4 p-6">
          <h2 className="text-base font-semibold">Policyholder details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full legal name" error={errors.fullName}>
              <input
                value={personal.fullName}
                maxLength={80}
                onChange={(e) => set("fullName", e.target.value)}
                className={inputClass}
                placeholder="Jean Mugisha"
              />
            </Field>
            <Field label="Email address" error={errors.email}>
              <input
                type="email"
                value={personal.email}
                maxLength={120}
                onChange={(e) => set("email", e.target.value)}
                className={inputClass}
                placeholder="you@mail.rw"
              />
            </Field>
            <Field label="Phone number" error={errors.phone}>
              <input
                value={personal.phone}
                maxLength={15}
                onChange={(e) => set("phone", e.target.value)}
                className={inputClass}
                placeholder="078 000 0000"
              />
            </Field>
            <Field label="National ID / passport" error={errors.nationalId}>
              <input
                value={personal.nationalId}
                maxLength={30}
                onChange={(e) => set("nationalId", e.target.value)}
                className={inputClass}
                placeholder="1199 8000 0000 0000"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Residential address" error={errors.address}>
                <input
                  value={personal.address}
                  maxLength={120}
                  onChange={(e) => set("address", e.target.value)}
                  className={inputClass}
                  placeholder="KK 15 Ave, Kicukiro, Kigali"
                />
              </Field>
            </div>
          </div>
        </div>

        <div className="surface space-y-4 p-6">
          <div>
            <h2 className="text-base font-semibold">Required documents</h2>
            <p className="text-sm text-muted-foreground">
              {requiredDocs.join(" · ")}. PDF, JPG or PNG up to 8MB each.
            </p>
          </div>

          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-input bg-muted/40 px-6 py-8 text-center transition-colors hover:bg-accent">
            <FileUp className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold">Choose files to upload</span>
            <span className="text-xs text-muted-foreground">Stored securely against this policy only</span>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
          </label>

          {documents.length > 0 && (
            <ul className="divide-y divide-border rounded-2xl border border-border">
              {documents.map((doc) => (
                <li key={doc} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="truncate">{doc}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${doc}`}
                    onClick={() => setDocuments((prev) => prev.filter((d) => d !== doc))}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {errors.documents && <p className="text-xs font-medium text-destructive">{errors.documents}</p>}
        </div>

        <div className="surface space-y-4 p-6">
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => {
                setTerms(e.target.checked);
                setErrors((prev) => ({ ...prev, terms: "" }));
              }}
              className="mt-0.5 h-4 w-4 rounded border-input"
            />
            <span>
              I confirm the information above is accurate and I accept the {plan.provider} policy wording, the
              InsureHub terms of service and privacy policy. I understand cover starts once payment is confirmed.
            </span>
          </label>
          {errors.terms && <p className="text-xs font-medium text-destructive">{errors.terms}</p>}

          <div className="flex flex-wrap gap-3 border-t border-border pt-4">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand transition-colors hover:bg-primary/90"
            >
              Continue to payment
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={saveForLater}
              className="inline-flex items-center gap-2 rounded-full border border-input px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
            >
              <Save className="h-4 w-4" />
              Save & finish later
            </button>
          </div>
        </div>
      </form>
    </FlowShell>
  );
}
