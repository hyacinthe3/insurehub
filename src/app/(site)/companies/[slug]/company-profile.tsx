"use client";

import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Building2, CheckCircle2, Clock3, Lock, MessageSquare, ShieldCheck, Star } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/flow/flow-ui";
import { formatRwf } from "@/lib/insurance-data";
import {
  checkCompanyReviewEligibility,
  getCompanyReviews,
  getMarketplaceProducts,
  postCompanyReview,
  type CompanyReview,
  type MarketplaceProduct,
  type MarketplaceCompany,
} from "@/lib/api";
import { cn } from "@/lib/utils";

export default function CompanyProfile({ company }: { company: MarketplaceCompany }) {
  const [category, setCategory] = useState("all");
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);

  // Review states
  const [reviews, setReviews] = useState<CompanyReview[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [avgRating, setAvgRating] = useState<number | null>(company.rating);
  const [eligible, setEligible] = useState<boolean>(false);
  const [eligibilityReason, setEligibilityReason] = useState<string | null>(null);

  // Review form state
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [commentInput, setCommentInput] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Fetch products
    getMarketplaceProducts()
      .then((list) => {
        if (!cancelled) setProducts(list.filter((p) => p.provider === company?.name));
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });

    // Fetch reviews & rating
    getCompanyReviews(company.slug)
      .then((res) => {
        if (cancelled) return;
        setReviews(res.reviews);
        setReviewCount(res.count);
        if (res.avgRating !== null) setAvgRating(res.avgRating);
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      });

    // Check eligibility
    checkCompanyReviewEligibility(company.slug)
      .then((res) => {
        if (cancelled) return;
        setEligible(res.eligible);
        setEligibilityReason(res.reason);
      })
      .catch(() => {
        if (!cancelled) setEligible(false);
      });

    return () => {
      cancelled = true;
    };
  }, [company]);

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))];
  const visible = category === "all" ? products : products.filter((p) => p.category === category);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) {
      setReviewError("Please enter your comment or review text.");
      return;
    }

    setSubmittingReview(true);
    setReviewError(null);
    setReviewSuccess(null);

    try {
      const newReview = await postCompanyReview(company.slug, {
        rating: ratingInput,
        comment: commentInput.trim(),
      });
      setReviews((prev) => [newReview, ...prev]);
      setReviewCount((prev) => prev + 1);
      setCommentInput("");
      setReviewSuccess("Thank you! Your verified policyholder review has been published.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to post review. Please try again.";
      setReviewError(msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <section className="px-5 py-10 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <nav className="text-xs text-muted-foreground">
          <Link href="/companies" className="font-semibold text-primary hover:underline">
            Providers
          </Link>
          <span className="px-1.5">/</span>
          {company.name}
        </nav>

        <header className="surface p-6 lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex min-w-0 items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-brand">
                <Building2 className="h-7 w-7" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{company.name}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full border border-success/25 bg-success/12 px-2.5 py-0.5 text-xs font-semibold text-success">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Licensed {company.license}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{company.tagline}</p>
                <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{company.about}</p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4 lg:grid-cols-2">
              {[
                { label: "Rating", value: `${avgRating ?? company.rating} / 5 (${reviewCount} reviews)`, icon: Star },
                { label: "Avg. claim time", value: `${company.avgClaimDays} days`, icon: Clock3 },
                { label: "Claims paid", value: company.claimsPaidRate, icon: ShieldCheck },
                { label: "Branches", value: `${company.branches}`, icon: Building2 },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-border bg-muted/40 px-4 py-3">
                  <dt className="text-xs text-muted-foreground">{s.label}</dt>
                  <dd className="mt-0.5 font-semibold text-xs truncate">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </header>

        {/* Insurance Products Section */}
        <div className="space-y-5">
          <h2 className="text-xl font-bold">Published Insurance Products</h2>
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                  category === c
                    ? "border-primary bg-primary text-primary-foreground shadow-brand"
                    : "border-input hover:bg-accent",
                )}
              >
                {c === "all" ? `All products (${products.length})` : c}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="surface p-12 text-center">
              <p className="font-semibold">No products in this category yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {company.name} has not published cover here. Try another category or browse the whole marketplace.
              </p>
              <Link
                href="/browse"
                className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand"
              >
                Browse marketplace
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {visible.map((plan) => (
                <article key={plan.id} className="surface flex flex-col gap-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">{plan.category}</p>
                      <h3 className="mt-0.5 truncate text-lg font-semibold">{plan.name}</h3>
                    </div>
                    {plan.badge && (
                      <span className="shrink-0 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {plan.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2">
                        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                        {h}
                      </li>
                    ))}
                  </ul>
                  <dl className="grid grid-cols-3 gap-3 border-t border-border pt-4 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Premium</dt>
                      <dd className="mt-0.5 font-semibold">{formatRwf(plan.monthly)}/mo</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Cover</dt>
                      <dd className="mt-0.5 font-semibold">{formatRwf(plan.coverAmount, { compact: true })}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Claims</dt>
                      <dd className="mt-0.5 font-semibold">{plan.claimDays}</dd>
                    </div>
                  </dl>
                  <Link
                    href={`/products/${plan.id}`}
                    className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand transition-colors hover:bg-primary/90"
                  >
                    View product details
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Customer Ratings & Reviews Section */}
        <section className="surface p-6 lg:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
            <div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Verified Customer Ratings & Reviews</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Authentic feedback submitted exclusively by customers holding approved policies with {company.name}.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-muted/60 px-4 py-2 text-sm font-bold">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <span>{avgRating ?? company.rating} / 5</span>
              <span className="text-xs font-normal text-muted-foreground">({reviewCount} reviews)</span>
            </div>
          </div>

          {/* Form / Eligibility Section */}
          <div className="rounded-2xl border border-border/80 bg-card p-5">
            {eligible ? (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <h3 className="text-sm font-bold text-foreground">
                    Verified Policyholder — Leave Your Rating & Review
                  </h3>
                </div>

                {/* Rating selection */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                    Your Overall Rating:
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingInput(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 text-warning focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star
                          className={cn(
                            "h-6 w-6",
                            star <= (hoverRating || ratingInput)
                              ? "fill-warning text-warning"
                              : "text-muted border-muted",
                          )}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-semibold text-foreground">
                      {hoverRating || ratingInput} / 5 Stars
                    </span>
                  </div>
                </div>

                {/* Comment box */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                    Your Review / Comment:
                  </label>
                  <textarea
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder={`Share details about your experience with ${company.name}'s customer service, claims, or policy terms...`}
                    rows={3}
                    className="w-full rounded-xl border border-border bg-muted/40 p-3 text-xs outline-none focus:border-primary placeholder:text-muted-foreground"
                  />
                </div>

                {reviewError && (
                  <p className="text-xs font-medium text-destructive">{reviewError}</p>
                )}
                {reviewSuccess && (
                  <p className="text-xs font-medium text-success">{reviewSuccess}</p>
                )}

                <Button type="submit" disabled={submittingReview} className="gap-2 text-xs font-bold">
                  {submittingReview ? <Spinner /> : <MessageSquare className="h-4 w-4" />}
                  {submittingReview ? "Submitting Review…" : "Submit Customer Review"}
                </Button>
              </form>
            ) : (
              <div className="flex items-start gap-3 text-xs text-muted-foreground">
                <Lock className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">
                    {eligibilityReason === "NOT_SIGNED_IN"
                      ? "Sign in with a verified account to review"
                      : "Verified Policyholder Protection Active"}
                  </p>
                  <p className="mt-1 leading-relaxed">
                    {eligibilityReason === "NOT_SIGNED_IN" ? (
                      <>
                        Only customers with an approved policy from {company.name} can submit reviews.{" "}
                        <Link href="/auth/login" className="font-semibold text-primary underline">
                          Sign in to your account
                        </Link>
                      </>
                    ) : (
                      `To maintain 100% genuine feedback, rating and reviewing ${company.name} is restricted to customers who have applied for an insurance policy with them and have been approved.`
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Customer Reviews List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Customer Reviews ({reviews.length})
            </h3>

            {reviews.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No customer reviews posted yet for {company.name}.
              </p>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div key={rev.id} className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground">{rev.authorName}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                          <CheckCircle2 className="h-3 w-3" /> Verified Policyholder
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3.5 w-3.5",
                            i < rev.rating ? "fill-warning text-warning" : "text-muted",
                          )}
                        />
                      ))}
                    </div>

                    <p className="text-xs text-foreground/90 leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
