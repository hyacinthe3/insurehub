"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ban, Check, FileText, HelpCircle, Scale, ShieldCheck, Star, Wallet, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Spinner } from "@/components/flow/flow-ui";
import { useCompare } from "@/context/compare-context";
import { exclusionsFor } from "@/lib/companies-data";
import {
  createDraft,
  getMarketplaceProduct,
  getMarketplaceCompanies,
  getMarketplaceProductQuestions,
  type MarketplaceProduct,
  type QuoteQuestion,
} from "@/lib/api";
import { formatRwf } from "@/lib/insurance-data";

function getRequiredDocuments(categorySlug: string): string[] {
  switch (categorySlug) {
    case "motor":
      return [
        "National ID or Valid Passport of vehicle owner",
        "Vehicle Yellow Card (Carte Jaune / Registration Certificate)",
        "Valid Technical Control Certificate (Contrôle Technique)",
        "Driving License of primary driver(s)",
      ];
    case "health":
    case "life":
      return [
        "National ID or Birth Certificate for dependents",
        "Recent Medical Questionnaire / Declaration form",
        "Passport Photo of primary policyholder",
      ];
    case "property":
    case "fire-burglary":
      return [
        "Title Deed (UPI) or Official Lease Agreement",
        "Property Valuation Report or Purchase Invoice",
        "National ID or Company Registration (RDB)",
      ];
    case "business":
    case "marine-cargo":
      return [
        "RDB Business Registration Certificate & TIN",
        "Financial Statements / Asset Schedule",
        "National ID of Authorized Representative",
      ];
    default:
      return [
        "National ID or Valid Passport",
        "Proof of Address / Location",
        "Relevant Asset or Liability Supporting Documentation",
      ];
  }
}

export default function ProductDetail({ planId }: { planId: string }) {
  const router = useRouter();
  const { toggleCompare, isInCompare } = useCompare();
  const [plan, setPlan] = useState<MarketplaceProduct | null>(null);
  const [companyMap, setCompanyMap] = useState<Map<string, { slug: string; name: string }>>(new Map());
  const [questions, setQuestions] = useState<QuoteQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getMarketplaceProduct(planId),
      getMarketplaceCompanies(),
      getMarketplaceProductQuestions(planId).catch(() => ({ planId, questions: [] as QuoteQuestion[] })),
    ])
      .then(([productData, companyList, questionSet]) => {
        if (cancelled) return;
        setPlan(productData);
        setCompanyMap(new Map(companyList.map((c) => [c.name, { slug: c.slug, name: c.name }])));
        setQuestions(questionSet.questions ?? []);
      })
      .catch(() => {
        if (!cancelled) setPlan(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [planId]);

  if (loading) {
    return (
      <section className="px-5 py-12 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="surface p-16 text-center">
            <Spinner />
            <p className="mt-3 font-semibold text-base">Loading product details…</p>
            <p className="mt-1 text-sm text-muted-foreground">Fetching official filed product specifications.</p>
          </div>
        </div>
      </section>
    );
  }

  if (!plan) {
    return (
      <section className="px-5 py-12 lg:px-8">
        <div className="mx-auto w-full max-w-4xl text-center">
          <div className="surface p-12">
            <HelpCircle className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-bold">Product Not Found or Not Published</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This insurance product is either unavailable or has not been published to the marketplace yet.
            </p>
            <Link
              href="/browse"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand"
            >
              Browse Published Products
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const company = companyMap.get(plan.provider);
  const exclusions = plan.exclusions && plan.exclusions.length > 0
    ? plan.exclusions
    : exclusionsFor(plan.categorySlug);
  const requiredDocs = getRequiredDocuments(plan.categorySlug);

  const startQuote = async () => {
    setStarting(true);
    setError(null);
    try {
      const draft = await createDraft(plan.id);
      router.push(`/quote/${draft.id}`);
    } catch {
      setStarting(false);
      setError("We couldn't start your quote. Please try again.");
    }
  };

  return (
    <section className="px-5 py-10 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center justify-between">
          <Link
            href="/browse"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>
          {company && (
            <Link
              href={`/companies/${company.slug}`}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              View insurer profile ({company.name}) →
            </Link>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          {/* Main Content */}
          <div className="space-y-6">
            <header className="surface p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  {plan.category}
                </span>
                {plan.badge && (
                  <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
                    {plan.badge}
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{plan.name}</h1>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                Underwritten by <span className="font-semibold text-foreground">{plan.provider}</span> · Rated{" "}
                <span className="inline-flex items-center gap-1 font-bold text-foreground">
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                  {plan.providerRating} / 5
                </span>
              </p>

              {plan.description && (
                <p className="mt-4 text-sm leading-relaxed text-foreground/90 border-t border-border pt-4">
                  {plan.description}
                </p>
              )}

              {plan.highlights && plan.highlights.length > 0 && (
                <div className="mt-5 border-t border-border pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Key Highlights</h3>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {plan.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2 text-xs font-medium">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </header>

            {/* Coverage Details & Benefits */}
            <div className="surface overflow-hidden">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-base font-bold">Coverage Details & Benefits</h2>
                <p className="text-xs text-muted-foreground">Features included in this policy schedule.</p>
              </div>
              <ul className="divide-y divide-border">
                {Object.entries(plan.features).map(([label, value]) => (
                  <li key={label} className="flex items-center justify-between gap-4 px-6 py-3.5 text-sm">
                    <span className="font-medium">{label}</span>
                    <span className="font-semibold">
                      {value === true ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-success">
                          <Check className="h-4 w-4" /> Included
                        </span>
                      ) : value === false ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                          <X className="h-4 w-4" /> Not covered
                        </span>
                      ) : (
                        <span className="text-xs font-semibold">{String(value)}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Benefits list if available */}
            {plan.benefits && plan.benefits.length > 0 && (
              <div className="surface p-6">
                <h2 className="text-base font-bold">Included Policy Benefits</h2>
                <ul className="mt-3 space-y-2">
                  {plan.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Exclusions */}
            <div className="surface overflow-hidden">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-base font-bold">Policy Exclusions</h2>
                <p className="text-xs text-muted-foreground">Specific situations and claims not covered under this policy wording.</p>
              </div>
              <ul className="divide-y divide-border">
                {exclusions.map((e) => (
                  <li key={e} className="flex items-start gap-2.5 px-6 py-3.5 text-sm text-muted-foreground">
                    <Ban className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What you'll be asked */}
            {questions.length > 0 && (
              <div className="surface p-6">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-bold">What You&apos;ll Be Asked</h2>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  A quick eligibility questionnaire appears when you start a quote. Items marked required must be answered.
                </p>
                <ul className="mt-4 space-y-2">
                  {questions.map((q) => (
                    <li
                      key={q.key}
                      className="flex items-start justify-between gap-3 rounded-xl bg-muted/60 px-3.5 py-2.5 text-xs"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        {q.required && <span className="text-primary">*</span>}
                        {q.label}
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {q.required ? "Required" : "Optional"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Required Documents */}
            <div className="surface p-6">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="text-base font-bold">Required Documents for Application</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Prepare these documents when completing your quote and document upload step.
              </p>
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {requiredDocs.map((doc) => (
                  <li key={doc} className="flex items-center gap-2.5 rounded-xl bg-muted/60 p-3 text-xs font-medium">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      ✓
                    </span>
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar Summary & Actions */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="surface p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Indicative Pricing</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight">{formatRwf(plan.monthly)}</span>
                <span className="text-sm text-muted-foreground">/ month</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatRwf(plan.monthly * 11)} billed annually (save 1 month)
              </p>

              <div className="mt-6 border-t border-border pt-4">
                <dl className="space-y-3.5 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground font-medium">Coverage Limit</dt>
                    <dd className="font-bold text-foreground">{formatRwf(plan.coverAmount)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground font-medium">Deductible / Excess</dt>
                    <dd className="font-bold text-foreground">
                      {plan.excessAmount === 0 ? "No deductible" : formatRwf(plan.excessAmount)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground font-medium">Policy Duration</dt>
                    <dd className="font-bold text-foreground">{plan.policyDuration || "12 months (renewable)"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground font-medium">Claim Settlement</dt>
                    <dd className="font-bold text-foreground">{plan.claimDays}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground font-medium">Eligible Applicants</dt>
                    <dd className="font-bold text-foreground">{plan.customerTypes.join(", ")}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground font-medium">Payment Frequency</dt>
                    <dd className="font-bold text-foreground">{plan.payments.join(", ")}</dd>
                  </div>
                  {plan.eligibility && (
                    <div className="border-t border-border/60 pt-2.5">
                      <dt className="text-muted-foreground font-medium mb-1">Eligibility Requirement</dt>
                      <dd className="font-semibold text-foreground leading-snug">{plan.eligibility}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-2.5">
                <button
                  type="button"
                  onClick={startQuote}
                  disabled={starting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-brand transition-colors hover:bg-primary/90 disabled:opacity-70"
                >
                  {starting ? <Spinner /> : <Wallet className="h-4 w-4" />}
                  {starting ? "Starting your quote…" : "Get Quote"}
                </button>
                <button
                  type="button"
                  onClick={() => toggleCompare(plan)}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-xs font-semibold transition-colors ${
                    isInCompare(plan.id)
                      ? "border-primary/40 bg-primary/10 text-primary font-bold hover:bg-primary/20"
                      : "border-border bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  {isInCompare(plan.id) ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Added to Comparison
                    </>
                  ) : (
                    <>
                      <Scale className="h-3.5 w-3.5" /> Add to Comparison
                    </>
                  )}
                </button>
              </div>

              {error && <p className="mt-2 text-xs font-medium text-destructive text-center">{error}</p>}

              <p className="mt-4 flex items-start gap-1.5 text-xs text-muted-foreground border-t border-border pt-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>
                  Quotes are saved instantly in your profile. You can upload documents and complete purchase at any time.
                </span>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
