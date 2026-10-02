"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  Check,
  ExternalLink,
  HelpCircle,
  Info,
  Minus,
  Plus,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Star,
  Trash2,
  Wallet,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/flow/flow-ui";
import { useCompare } from "@/context/compare-context";
import { createDraft, getMarketplaceComparison, type MarketplaceProduct } from "@/lib/api";
import { formatRwf } from "@/lib/insurance-data";

function FeatureCell({ value }: { value: boolean | string | unknown }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-success">
        <Check className="h-4 w-4 shrink-0" /> Included
      </span>
    );
  }
  if (value === false || value === undefined) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Minus className="h-4 w-4 shrink-0 text-muted-foreground/60" /> Not covered
      </span>
    );
  }
  return <span className="text-xs font-semibold text-foreground">{String(value)}</span>;
}

export default function CompareClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedProducts, removeProduct, clearCompare, setSelectedProducts } = useCompare();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [highlightDiffs, setHighlightDiffs] = useState(false);
  const [startingQuoteId, setStartingQuoteId] = useState<string | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  // Extract query IDs from searchParams e.g. ?ids=p1,p2
  const queryIds = useMemo(() => {
    const raw = searchParams.get("ids") ?? "";
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    // Use queryIds if available; otherwise fallback to context selectedProducts
    const idsToFetch = queryIds.length > 0 ? queryIds : selectedProducts.map((p) => p.id);

    if (idsToFetch.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    if (idsToFetch.length < 2) {
      setProducts([]);
      setLoading(false);
      setError("Select at least 2 products to display side-by-side comparison.");
      return;
    }

    setLoading(true);
    setError(null);

    getMarketplaceComparison(idsToFetch)
      .then((data) => {
        if (cancelled) return;
        setProducts(data);
        // Sync back with context if different
        if (data.length > 0) {
          setSelectedProducts(data);
        }
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setProducts([]);
        setError(err.message || "Failed to load product comparison. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [queryIds, setSelectedProducts]);

  const handleRemove = (id: string) => {
    removeProduct(id);
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);

    if (updated.length > 0) {
      const newUrl = `/compare?ids=${updated.map((p) => p.id).join(",")}`;
      router.replace(newUrl);
    } else {
      router.replace("/compare");
    }
  };

  const handleStartQuote = async (planId: string) => {
    setStartingQuoteId(planId);
    try {
      const draft = await createDraft(planId);
      router.push(`/quote/${draft.id}`);
    } catch {
      setStartingQuoteId(null);
      alert("Could not start quote. Please try again.");
    }
  };

  const handleBuyNow = async (planId: string) => {
    setBuyingId(planId);
    try {
      const draft = await createDraft(planId);
      router.push(`/quote/${draft.id}?checkout=true`);
    } catch {
      setBuyingId(null);
      alert("Could not initiate purchase flow. Please try again.");
    }
  };

  // Collect all unique feature keys across all products
  const allFeatureKeys = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.features && typeof p.features === "object") {
        Object.keys(p.features).forEach((k) => set.add(k));
      }
    });
    return Array.from(set);
  }, [products]);

  // Helper to check if row values differ across products
  const isDifferent = (values: unknown[]) => {
    if (values.length <= 1) return false;
    const first = JSON.stringify(values[0]);
    return values.some((v) => JSON.stringify(v) !== first);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="surface p-16 text-center">
          <Spinner />
          <h2 className="mt-4 text-lg font-bold">Loading Side-by-Side Comparison…</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Fetching published product details and live coverage schedules.
          </p>
        </div>
      </div>
    );
  }

  // If fewer than 2 products or error
  if (products.length < 2) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-12 lg:px-8 lg:py-16">
        <nav className="text-xs text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          <span className="px-2">/</span>
          <Link href="/browse" className="hover:text-primary">
            Browse
          </Link>
          <span className="px-2">/</span>
          <span className="text-foreground">Compare</span>
        </nav>

        <header className="mt-6 text-center max-w-2xl mx-auto">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Scale className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Compare Insurance Products
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Select 2 to 4 products from the marketplace to view a side-by-side breakdown of premiums, coverage limits, benefits, and exclusions.
          </p>
        </header>

        {error && (
          <div className="mt-6 rounded-2xl bg-destructive/10 border border-destructive/30 p-4 text-center text-xs font-semibold text-destructive max-w-lg mx-auto flex items-center justify-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="surface p-6 flex flex-col justify-between">
              <div>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                  {p.category}
                </span>
                <h3 className="mt-3 text-lg font-bold">{p.name}</h3>
                <p className="text-xs text-muted-foreground">{p.provider}</p>
                <div className="mt-4 text-2xl font-black text-foreground">
                  {formatRwf(p.monthly)} <span className="text-xs font-semibold text-muted-foreground">/mo</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-6 text-xs text-destructive hover:bg-destructive/10"
                onClick={() => handleRemove(p.id)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
              </Button>
            </div>
          ))}

          {Array.from({ length: Math.max(1, 3 - products.length) }).map((_, idx) => (
            <Link
              key={idx}
              href="/browse"
              className="group border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all bg-card/40 hover:bg-card"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <Plus className="h-6 w-6" />
              </div>
              <h4 className="mt-3 text-sm font-bold text-foreground">Add Product to Compare</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Browse marketplace products to select policies in the same category
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button asChild size="lg" className="font-bold shadow-brand gap-2">
            <Link href="/browse">
              <ArrowLeft className="h-4 w-4" /> Go to Marketplace
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const categoryName = products[0]?.category ?? "Insurance";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-12">
      {/* Breadcrumb & Header */}
      <nav className="text-xs text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <span className="px-2">/</span>
        <Link href="/browse" className="hover:text-primary">
          Browse
        </Link>
        <span className="px-2">/</span>
        <span className="text-foreground">Compare</span>
      </nav>

      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-border pb-6">
        <div>
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {categoryName} Category Comparison
          </span>
          <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-4xl">
            Comparing {products.length} {categoryName} Policies Side-by-Side
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Review side-by-side pricing, limits, claim settlement speed, benefits, and exclusions from active, regulated providers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-card border border-border px-3 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-muted transition-colors">
            <input
              type="checkbox"
              checked={highlightDiffs}
              onChange={(e) => setHighlightDiffs(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary"
            />
            <span>Highlight Differences</span>
          </label>

          <Button
            variant="outline"
            size="sm"
            onClick={clearCompare}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Clear All
          </Button>

          {products.length < 4 && (
            <Button size="sm" variant="outline" asChild className="text-xs gap-1">
              <Link href="/browse">
                <Plus className="h-3.5 w-3.5" /> Add Product
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Comparison Table Container */}
      <div className="mt-8 surface overflow-x-auto shadow-lift border border-border/80 rounded-2xl">
        <table className="w-full min-w-[800px] border-collapse text-left">
          {/* STICKY HEADER WITH PRODUCT DETAILS & ACTIONS */}
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="w-[220px] min-w-[200px] p-5 text-xs font-bold uppercase tracking-wider text-muted-foreground align-top bg-card sticky left-0 z-20 shadow-r">
                Policy & Provider
              </th>
              {products.map((plan) => (
                <th key={plan.id} className="min-w-[240px] p-5 align-top border-l border-border/60">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary truncate">
                      {plan.provider}
                    </span>
                    <button
                      onClick={() => handleRemove(plan.id)}
                      className="rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Remove product from comparison"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <h2 className="mt-1 text-base font-extrabold tracking-tight text-foreground">
                    <Link href={`/products/${plan.id}`} className="hover:text-primary transition-colors">
                      {plan.name}
                    </Link>
                  </h2>

                  <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                    <span className="text-foreground">{plan.providerRating}</span> / 5 rating
                  </div>

                  {plan.badge && (
                    <span className="mt-2 inline-block rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold text-accent-foreground">
                      {plan.badge}
                    </span>
                  )}

                  {/* Pricing Box */}
                  <div className="mt-4 rounded-xl bg-muted/60 p-3 border border-border/40">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-foreground">{formatRwf(plan.monthly)}</span>
                      <span className="text-xs text-muted-foreground">/mo</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatRwf(plan.monthly * 11)} billed annually
                    </p>
                  </div>

                  {/* Configured Actions based on purchaseMethod */}
                  <div className="mt-4 space-y-2">
                    {(plan.purchaseMethod === "quote" || plan.purchaseMethod === "both") && (
                      <Button
                        size="sm"
                        className="w-full gap-1.5 font-bold shadow-brand text-xs"
                        onClick={() => handleStartQuote(plan.id)}
                        disabled={startingQuoteId === plan.id}
                      >
                        {startingQuoteId === plan.id ? <Spinner /> : <Wallet className="h-3.5 w-3.5" />}
                        {startingQuoteId === plan.id ? "Starting…" : "Get Quote"}
                      </Button>
                    )}

                    {(plan.purchaseMethod === "buy_now" || plan.purchaseMethod === "both") && (
                      <Button
                        size="sm"
                        variant={plan.purchaseMethod === "both" ? "outline" : "default"}
                        className={`w-full gap-1.5 text-xs font-bold ${
                          plan.purchaseMethod === "buy_now" ? "shadow-brand" : ""
                        }`}
                        onClick={() => handleBuyNow(plan.id)}
                        disabled={buyingId === plan.id}
                      >
                        {buyingId === plan.id ? <Spinner /> : <Zap className="h-3.5 w-3.5 text-accent-foreground" />}
                        {buyingId === plan.id ? "Processing…" : "Buy Now"}
                      </Button>
                    )}

                    <Button variant="ghost" size="sm" className="w-full text-[11px] text-muted-foreground h-7" asChild>
                      <Link href={`/products/${plan.id}`}>
                        Full Specs <ExternalLink className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* TABLE BODY SECTIONS */}
          <tbody>
            {/* SECTION 1: FINANCIAL & KEY SPECS */}
            <tr className="bg-muted/80 border-b border-border">
              <td
                colSpan={products.length + 1}
                className="px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-foreground"
              >
                1. Financial & Coverage Specifications
              </td>
            </tr>

            {/* Coverage Limit */}
            <TableRow
              label="Coverage Limit"
              highlight={highlightDiffs && isDifferent(products.map((p) => p.coverAmount))}
              help="Maximum sum insured payout by insurer"
            >
              {products.map((p) => (
                <td key={p.id} className="p-4 border-l border-border/50 text-sm font-bold text-foreground">
                  {formatRwf(p.coverAmount)}
                </td>
              ))}
            </TableRow>

            {/* Deductible / Excess */}
            <TableRow
              label="Deductible / Excess"
              highlight={highlightDiffs && isDifferent(products.map((p) => p.excessAmount))}
              help="Amount customer pays out of pocket before insurer pays claim"
            >
              {products.map((p) => (
                <td key={p.id} className="p-4 border-l border-border/50 text-sm font-semibold">
                  {p.excessAmount === 0 ? (
                    <span className="text-success font-bold">Zero Excess (No Deductible)</span>
                  ) : (
                    formatRwf(p.excessAmount)
                  )}
                </td>
              ))}
            </TableRow>

            {/* Policy Duration */}
            <TableRow
              label="Policy Duration"
              highlight={highlightDiffs && isDifferent(products.map((p) => p.policyDuration ?? "12 months"))}
            >
              {products.map((p) => (
                <td key={p.id} className="p-4 border-l border-border/50 text-xs font-semibold">
                  {p.policyDuration || "12 months (renewable)"}
                </td>
              ))}
            </TableRow>

            {/* Claim Settlement Speed */}
            <TableRow
              label="Claim Settlement Speed"
              highlight={highlightDiffs && isDifferent(products.map((p) => p.claimDays))}
              help="Average time to process and pay valid claims"
            >
              {products.map((p) => (
                <td key={p.id} className="p-4 border-l border-border/50 text-xs font-semibold">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-foreground font-bold">
                    <ShieldCheck className="h-3.5 w-3.5 text-success" />
                    {p.claimDays}
                  </span>
                </td>
              ))}
            </TableRow>

            {/* Payment Frequency */}
            <TableRow
              label="Payment Options"
              highlight={highlightDiffs && isDifferent(products.map((p) => p.payments.join(",")))}
            >
              {products.map((p) => (
                <td key={p.id} className="p-4 border-l border-border/50 text-xs font-medium">
                  {p.payments.join(", ")}
                </td>
              ))}
            </TableRow>

            {/* Target Customer Types */}
            <TableRow
              label="Eligible Customers"
              highlight={highlightDiffs && isDifferent(products.map((p) => p.customerTypes.join(",")))}
            >
              {products.map((p) => (
                <td key={p.id} className="p-4 border-l border-border/50 text-xs font-medium">
                  {p.customerTypes.join(", ")}
                </td>
              ))}
            </TableRow>

            {/* SECTION 2: DYNAMIC COVERAGE FEATURES MATRIX */}
            {allFeatureKeys.length > 0 && (
              <>
                <tr className="bg-muted/80 border-b border-border">
                  <td
                    colSpan={products.length + 1}
                    className="px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-foreground"
                  >
                    2. Detailed Features & Coverage Matrix
                  </td>
                </tr>

                {allFeatureKeys.map((featureKey) => {
                  const featureValues = products.map((p) => p.features?.[featureKey]);
                  const diff = highlightDiffs && isDifferent(featureValues);

                  return (
                    <TableRow key={featureKey} label={featureKey} highlight={diff}>
                      {products.map((p) => (
                        <td key={p.id} className="p-4 border-l border-border/50">
                          <FeatureCell value={p.features?.[featureKey]} />
                        </td>
                      ))}
                    </TableRow>
                  );
                })}
              </>
            )}

            {/* SECTION 3: INCLUDED BENEFITS */}
            <tr className="bg-muted/80 border-b border-border">
              <td
                colSpan={products.length + 1}
                className="px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-foreground"
              >
                3. Key Highlights & Included Benefits
              </td>
            </tr>
            <TableRow label="Policy Benefits">
              {products.map((p) => {
                const items = p.benefits && p.benefits.length > 0 ? p.benefits : p.highlights;
                return (
                  <td key={p.id} className="p-4 border-l border-border/50 align-top">
                    {items && items.length > 0 ? (
                      <ul className="space-y-1.5 text-xs">
                        {items.map((b) => (
                          <li key={b} className="flex items-start gap-1.5">
                            <Check className="h-3.5 w-3.5 shrink-0 text-success mt-0.5" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                );
              })}
            </TableRow>

            {/* SECTION 4: EXCLUSIONS */}
            <tr className="bg-muted/80 border-b border-border">
              <td
                colSpan={products.length + 1}
                className="px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-foreground"
              >
                4. Policy Exclusions & Limitations
              </td>
            </tr>
            <TableRow label="Exclusions">
              {products.map((p) => (
                <td key={p.id} className="p-4 border-l border-border/50 align-top">
                  {p.exclusions && p.exclusions.length > 0 ? (
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      {p.exclusions.map((e) => (
                        <li key={e} className="flex items-start gap-1.5">
                          <Ban className="h-3.5 w-3.5 shrink-0 text-destructive mt-0.5" />
                          <span>{e}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-muted-foreground">Standard statutory exclusions apply</span>
                  )}
                </td>
              ))}
            </TableRow>

            {/* SECTION 5: ELIGIBILITY & DOCUMENTS */}
            <tr className="bg-muted/80 border-b border-border">
              <td
                colSpan={products.length + 1}
                className="px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-foreground"
              >
                5. Eligibility & Documentation Requirements
              </td>
            </tr>

            <TableRow label="Eligibility Notes">
              {products.map((p) => (
                <td key={p.id} className="p-4 border-l border-border/50 text-xs text-muted-foreground">
                  {p.eligibility || "Standard underwriting terms apply"}
                </td>
              ))}
            </TableRow>

            <TableRow label="Required Documents">
              {products.map((p) => (
                <td key={p.id} className="p-4 border-l border-border/50 align-top">
                  {p.requiredDocuments && p.requiredDocuments.length > 0 ? (
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {p.requiredDocuments.map((doc) => (
                        <li key={doc} className="flex items-center gap-1">
                          <span className="text-primary font-bold">✓</span> {doc}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-muted-foreground">National ID / Business Reg + Yellow Card</span>
                  )}
                </td>
              ))}
            </TableRow>
          </tbody>
        </table>
      </div>

      {/* Bottom Footer Callout */}
      <div className="mt-8 flex flex-col gap-4 rounded-2xl bg-muted/50 p-6 border border-border sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Info className="h-5 w-5 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            All premiums are shown in RWF inclusive of statutory levies. Policy issuance is subject to standard insurer verification of uploaded documents.
          </p>
        </div>
        <Button variant="outline" asChild size="sm" className="shrink-0 text-xs font-semibold">
          <Link href="/browse">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Marketplace
          </Link>
        </Button>
      </div>
    </div>
  );
}

function TableRow({
  label,
  children,
  highlight = false,
  help,
}: {
  label: string;
  children: React.ReactNode;
  highlight?: boolean;
  help?: string;
}) {
  return (
    <tr
      className={`border-b border-border transition-colors ${
        highlight
          ? "bg-amber-500/10 dark:bg-amber-950/30 border-l-4 border-l-amber-500"
          : "hover:bg-muted/40"
      }`}
    >
      <td className="p-4 text-xs font-bold text-foreground align-top bg-card/60 sticky left-0 z-10 shadow-r">
        <div>{label}</div>
        {help && <p className="mt-0.5 text-[10px] font-normal text-muted-foreground">{help}</p>}
      </td>
      {children}
    </tr>
  );
}
