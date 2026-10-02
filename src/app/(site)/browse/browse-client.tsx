"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ExternalLink, Info, Scale, Search, SlidersHorizontal, Star, Wallet, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/flow/flow-ui";
import { useCompare } from "@/context/compare-context";
import {
  customerTypes,
  formatRwf,
  paymentOptions,
  premiumRanges,
  type CustomerType,
  type PaymentOption,
} from "@/lib/insurance-data";
import { createDraft, type MarketplaceProduct } from "@/lib/api";
import { useMarketplace } from "@/lib/use-marketplace";

type Sort = "value" | "premium_asc" | "premium_desc" | "cover_desc" | "cover_asc" | "claims" | "rating";

const PAGE_SIZE = 6;

const COVER_RANGES = [
  { label: "All coverage amounts", min: 0 },
  { label: "RWF 5,000,000+", min: 5000000 },
  { label: "RWF 15,000,000+", min: 15000000 },
  { label: "RWF 50,000,000+", min: 50000000 },
  { label: "RWF 100,000,000+", min: 100000000 },
];

const DURATION_OPTIONS = [
  { label: "12 months (Annual)", value: "12_months" },
  { label: "6 months", value: "6_months" },
  { label: "Multi-year / Flexible", value: "flexible" },
];

function toggle<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function BrowseClient() {
  const router = useRouter();
  const { products, categories, loading } = useMarketplace();
  const { toggleCompare, isInCompare } = useCompare();
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categoryDropdown, setCategoryDropdown] = useState("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedRanges, setSelectedRanges] = useState<string[]>([]);
  const [minCover, setMinCover] = useState<number>(0);
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);
  const [selectedCustomerTypes, setSelectedCustomerTypes] = useState<CustomerType[]>([]);
  const [selectedPayments, setSelectedPayments] = useState<PaymentOption[]>([]);
  const [sort, setSort] = useState<Sort>("value");
  const [page, setPage] = useState(1);

  // Quote loading state tracking per product ID
  const [startingQuoteId, setStartingQuoteId] = useState<string | null>(null);

  const providerNames = useMemo(
    () => Array.from(new Set(products.map((p) => p.provider))),
    [products],
  );

  const activeCategories = useMemo(
    () =>
      categoryDropdown !== "all" && !selectedCategories.includes(categoryDropdown)
        ? [...selectedCategories, categoryDropdown]
        : selectedCategories,
    [categoryDropdown, selectedCategories],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const ranges = premiumRanges.filter((r) => selectedRanges.includes(r.label));

    const result = products.filter((plan) => {
      // Strictly verify status is published (redundant check for safety)
      if ((plan as unknown as { status?: string }).status && (plan as unknown as { status?: string }).status !== "published") {
        return false;
      }

      if (
        q &&
        ![plan.name, plan.provider, plan.category, plan.description, ...plan.highlights]
          .join(" ")
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }

      if (activeCategories.length && !activeCategories.includes(plan.categorySlug)) return false;
      if (selectedProviders.length && !selectedProviders.includes(plan.provider)) return false;
      if (ranges.length && !ranges.some((r) => plan.monthly >= r.min && plan.monthly < r.max))
        return false;
      if (minCover > 0 && plan.coverAmount < minCover) return false;
      if (
        selectedDurations.length &&
        !selectedDurations.some((dur) =>
          (plan.policyDuration ?? "12 months").toLowerCase().includes(dur.replace("_", " "))
        )
      ) {
        return false;
      }
      if (
        selectedCustomerTypes.length &&
        !plan.customerTypes.some((t) => selectedCustomerTypes.includes(t as CustomerType))
      )
        return false;
      if (
        selectedPayments.length &&
        !plan.payments.some((p) => selectedPayments.includes(p as PaymentOption))
      )
        return false;
      return true;
    });

    const sorters: Record<
      Sort,
      (a: MarketplaceProduct, b: MarketplaceProduct) => number
    > = {
      value: (a, b) => b.coverAmount / b.monthly - a.coverAmount / a.monthly,
      premium_asc: (a, b) => a.monthly - b.monthly,
      premium_desc: (a, b) => b.monthly - a.monthly,
      cover_desc: (a, b) => b.coverAmount - a.coverAmount,
      cover_asc: (a, b) => a.coverAmount - b.coverAmount,
      claims: (a, b) => a.claimSpeed - b.claimSpeed,
      rating: (a, b) => b.providerRating - a.providerRating,
    };
    return [...result].sort(sorters[sort]);
  }, [
    query,
    activeCategories,
    selectedProviders,
    selectedRanges,
    minCover,
    selectedDurations,
    selectedCustomerTypes,
    selectedPayments,
    sort,
    products,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const activeFilterCount =
    activeCategories.length +
    selectedProviders.length +
    selectedRanges.length +
    (minCover > 0 ? 1 : 0) +
    selectedDurations.length +
    selectedCustomerTypes.length +
    selectedPayments.length +
    (query ? 1 : 0);

  function resetFilters() {
    setQuery("");
    setSearchInput("");
    setCategoryDropdown("all");
    setSelectedCategories([]);
    setSelectedProviders([]);
    setSelectedRanges([]);
    setMinCover(0);
    setSelectedDurations([]);
    setSelectedCustomerTypes([]);
    setSelectedPayments([]);
    setPage(1);
  }

  const handleStartQuote = async (planId: string) => {
    setStartingQuoteId(planId);
    try {
      const draft = await createDraft(planId);
      router.push(`/quote/${draft.id}`);
    } catch {
      setStartingQuoteId(null);
      alert("Could not start quote. Please check your connection and try again.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
      <nav className="text-xs text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <span className="px-2">/</span>
        <span className="text-foreground">Browse insurance</span>
      </nav>

      <header className="mt-5 max-w-3xl">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Public Insurance Marketplace</h1>
        <p className="mt-3 text-muted-foreground">
          Browse vetted, published policies from licensed insurance providers in Rwanda. Search by insurer or product, filter by cover limits and duration, and compare plans side by side.
        </p>
      </header>

      {/* Search bar */}
      <form
        className="surface mt-8 grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_220px_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(searchInput);
          setPage(1);
        }}
      >
        <label className="flex min-w-0 items-center gap-3 rounded-xl bg-muted px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by product name, insurance provider, or keywords..."
            className="h-11 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
        <select
          value={categoryDropdown}
          onChange={(e) => {
            setCategoryDropdown(e.target.value);
            setPage(1);
          }}
          className="h-11 rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none"
        >
          <option value="all">All Insurance Categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <Button size="lg" type="submit" className="px-6">
          Search Marketplace
        </Button>
      </form>

      <div className="mt-10 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Sidebar Filters */}
        <aside className="surface h-fit p-5">
          <div className="flex items-center justify-between gap-2 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Filter Marketplace</h2>
            </div>
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </div>

          <div className="mt-6 space-y-7">
            {/* Category */}
            <FilterGroup title="Category">
              <ul className="max-h-52 space-y-1.5 overflow-auto pr-1">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <FilterCheckbox
                      label={c.name}
                      checked={activeCategories.includes(c.slug)}
                      onChange={() => {
                        if (categoryDropdown === c.slug) setCategoryDropdown("all");
                        setSelectedCategories((prev) => toggle(prev, c.slug));
                        setPage(1);
                      }}
                    />
                  </li>
                ))}
              </ul>
            </FilterGroup>

            {/* Provider */}
            <FilterGroup title="Insurance Company">
              <ul className="max-h-44 space-y-1.5 overflow-auto pr-1">
                {providerNames.map((p) => (
                  <li key={p}>
                    <FilterCheckbox
                      label={p}
                      checked={selectedProviders.includes(p)}
                      onChange={() => {
                        setSelectedProviders((prev) => toggle(prev, p));
                        setPage(1);
                      }}
                    />
                  </li>
                ))}
              </ul>
            </FilterGroup>

            {/* Minimum Cover Amount */}
            <FilterGroup title="Minimum Coverage Limit">
              <select
                value={minCover}
                onChange={(e) => {
                  setMinCover(Number(e.target.value));
                  setPage(1);
                }}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none"
              >
                {COVER_RANGES.map((r) => (
                  <option key={r.min} value={r.min}>
                    {r.label}
                  </option>
                ))}
              </select>
            </FilterGroup>

            {/* Policy Duration */}
            <FilterGroup title="Policy Duration">
              <ul className="space-y-1.5">
                {DURATION_OPTIONS.map((d) => (
                  <li key={d.value}>
                    <FilterCheckbox
                      label={d.label}
                      checked={selectedDurations.includes(d.value)}
                      onChange={() => {
                        setSelectedDurations((prev) => toggle(prev, d.value));
                        setPage(1);
                      }}
                    />
                  </li>
                ))}
              </ul>
            </FilterGroup>

            {/* Premium Range */}
            <FilterGroup title="Monthly Premium">
              <ul className="space-y-1.5">
                {premiumRanges.map((r) => (
                  <li key={r.label}>
                    <FilterCheckbox
                      label={r.label}
                      checked={selectedRanges.includes(r.label)}
                      onChange={() => {
                        setSelectedRanges((prev) => toggle(prev, r.label));
                        setPage(1);
                      }}
                    />
                  </li>
                ))}
              </ul>
            </FilterGroup>

            {/* Customer Type */}
            <FilterGroup title="Target Customer">
              <ul className="space-y-1.5">
                {customerTypes.map((t) => (
                  <li key={t}>
                    <FilterCheckbox
                      label={t}
                      checked={selectedCustomerTypes.includes(t)}
                      onChange={() => {
                        setSelectedCustomerTypes((prev) => toggle(prev, t));
                        setPage(1);
                      }}
                    />
                  </li>
                ))}
              </ul>
            </FilterGroup>

            {/* Payment Options */}
            <FilterGroup title="Payment Frequency">
              <ul className="space-y-1.5">
                {paymentOptions.map((o) => (
                  <li key={o}>
                    <FilterCheckbox
                      label={o}
                      checked={selectedPayments.includes(o)}
                      onChange={() => {
                        setSelectedPayments((prev) => toggle(prev, o));
                        setPage(1);
                      }}
                    />
                  </li>
                ))}
              </ul>
            </FilterGroup>
          </div>

          <Button variant="outline" className="mt-7 w-full" onClick={resetFilters}>
            Clear All Filters
          </Button>
        </aside>

        {/* Product Results */}
        <section>
          {loading ? (
            <div className="surface p-16 text-center">
              <Spinner />
              <p className="mt-3 font-semibold">Loading marketplace products…</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Connecting to database for live published policies.
              </p>
            </div>
          ) : (
            <>
              {/* Header bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-semibold text-foreground">{visible.length}</span> of{" "}
                  <span className="font-semibold text-foreground">{filtered.length}</span> published products
                </p>
                <div className="flex items-center gap-2">
                  <label htmlFor="sort-select" className="text-xs font-semibold text-muted-foreground">
                    Sort:
                  </label>
                  <select
                    id="sort-select"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as Sort)}
                    className="h-10 rounded-xl border border-border bg-card px-4 text-xs font-medium text-foreground outline-none shadow-sm"
                  >
                    <option value="value">Best Value Ratio</option>
                    <option value="premium_asc">Lowest Premium</option>
                    <option value="premium_desc">Highest Premium</option>
                    <option value="cover_desc">Highest Cover Limit</option>
                    <option value="cover_asc">Lowest Cover Limit</option>
                    <option value="claims">Fastest Claim Settlement</option>
                    <option value="rating">Highest Provider Rating</option>
                  </select>
                </div>
              </div>

              {/* Active Filter Chips */}
              {activeFilterCount > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {query && (
                    <Chip label={`Query: "${query}"`} onClear={() => { setQuery(""); setSearchInput(""); }} />
                  )}
                  {activeCategories.map((slug) => (
                    <Chip
                      key={slug}
                      label={categories.find((c) => c.slug === slug)?.name ?? slug}
                      onClear={() => {
                        if (categoryDropdown === slug) setCategoryDropdown("all");
                        setSelectedCategories((prev) => prev.filter((s) => s !== slug));
                      }}
                    />
                  ))}
                  {selectedProviders.map((p) => (
                    <Chip
                      key={p}
                      label={p}
                      onClear={() => setSelectedProviders((prev) => prev.filter((x) => x !== p))}
                    />
                  ))}
                  {minCover > 0 && (
                    <Chip
                      label={`Cover >= ${formatRwf(minCover, { compact: true })}`}
                      onClear={() => setMinCover(0)}
                    />
                  )}
                  {selectedDurations.map((d) => (
                    <Chip
                      key={d}
                      label={DURATION_OPTIONS.find((opt) => opt.value === d)?.label ?? d}
                      onClear={() => setSelectedDurations((prev) => prev.filter((x) => x !== d))}
                    />
                  ))}
                  {selectedRanges.map((r) => (
                    <Chip
                      key={r}
                      label={r}
                      onClear={() => setSelectedRanges((prev) => prev.filter((x) => x !== r))}
                    />
                  ))}
                  {selectedCustomerTypes.map((t) => (
                    <Chip
                      key={t}
                      label={t}
                      onClear={() => setSelectedCustomerTypes((prev) => prev.filter((x) => x !== t))}
                    />
                  ))}
                  {selectedPayments.map((p) => (
                    <Chip
                      key={p}
                      label={p}
                      onClear={() => setSelectedPayments((prev) => prev.filter((x) => x !== p))}
                    />
                  ))}
                </div>
              )}

              {/* Product Cards List */}
              <div className="mt-6 space-y-5">
                {visible.map((plan) => (
                  <article
                    key={plan.id}
                    className="surface grid gap-6 p-6 transition-all hover:border-primary/40 hover:shadow-lift lg:grid-cols-[minmax(0,1fr)_260px]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                          {plan.category}
                        </span>
                        {plan.badge && (
                          <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-accent-foreground">
                            {plan.badge}
                          </span>
                        )}
                        <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground">
                          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                          {plan.providerRating} / 5
                        </span>
                      </div>

                      <h3 className="mt-3 text-xl font-bold tracking-tight">
                        <Link href={`/products/${plan.id}`} className="hover:text-primary transition-colors">
                          {plan.name}
                        </Link>
                      </h3>
                      <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                        Underwritten by <span className="font-semibold text-foreground">{plan.provider}</span>
                      </p>

                      {plan.description && (
                        <p className="mt-2.5 text-xs text-muted-foreground line-clamp-2">
                          {plan.description}
                        </p>
                      )}

                      <dl className="mt-5 grid gap-3 sm:grid-cols-4">
                        <div className="rounded-xl bg-muted/60 p-3">
                          <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Cover limit</dt>
                          <dd className="mt-1 text-sm font-bold text-foreground">
                            {formatRwf(plan.coverAmount, { compact: true })}
                          </dd>
                        </div>
                        <div className="rounded-xl bg-muted/60 p-3">
                          <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Deductible</dt>
                          <dd className="mt-1 text-sm font-bold text-foreground">
                            {plan.excessAmount === 0 ? "No deductible" : formatRwf(plan.excessAmount)}
                          </dd>
                        </div>
                        <div className="rounded-xl bg-muted/60 p-3">
                          <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Duration</dt>
                          <dd className="mt-1 text-sm font-bold text-foreground truncate">
                            {plan.policyDuration || "12 months"}
                          </dd>
                        </div>
                        <div className="rounded-xl bg-muted/60 p-3">
                          <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Claim Speed</dt>
                          <dd className="mt-1 text-sm font-bold text-foreground truncate">
                            {plan.claimDays}
                          </dd>
                        </div>
                      </dl>

                      {plan.highlights && plan.highlights.length > 0 && (
                        <ul className="mt-4 flex flex-wrap gap-2">
                          {plan.highlights.slice(0, 4).map((h) => (
                            <li
                              key={h}
                              className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                            >
                              <Check className="h-3 w-3 text-success shrink-0" />
                              {h}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="flex flex-col justify-between gap-4 rounded-2xl bg-muted/50 border border-border/50 p-5">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-black text-foreground">{formatRwf(plan.monthly)}</span>
                          <span className="text-xs font-semibold text-muted-foreground">/mo</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatRwf(plan.monthly * 11)} billed annually
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Button
                          className="w-full gap-2 font-bold shadow-brand"
                          onClick={() => handleStartQuote(plan.id)}
                          disabled={startingQuoteId === plan.id}
                        >
                          {startingQuoteId === plan.id ? <Spinner /> : <Wallet className="h-4 w-4" />}
                          {startingQuoteId === plan.id ? "Starting..." : "Get Quote"}
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full gap-1 text-xs"
                          asChild
                        >
                          <Link href={`/products/${plan.id}`}>
                            View Details <ExternalLink className="h-3 w-3" />
                          </Link>
                        </Button>
                        <Button
                          variant={isInCompare(plan.id) ? "secondary" : "ghost"}
                          className={`w-full text-xs gap-1.5 ${
                            isInCompare(plan.id)
                              ? "border border-primary/40 bg-primary/10 text-primary font-bold hover:bg-primary/20"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          onClick={() => toggleCompare(plan)}
                        >
                          {isInCompare(plan.id) ? (
                            <>
                              <Check className="h-3.5 w-3.5" /> Added to Compare
                            </>
                          ) : (
                            <>
                              <Scale className="h-3.5 w-3.5" /> Compare Policy
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}

                {visible.length === 0 && (
                  <div className="surface p-12 text-center">
                    <Info className="mx-auto h-8 w-8 text-muted-foreground" />
                    <h3 className="mt-3 text-lg font-bold">No published products match these filters</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Try resetting your filters or adjusting your coverage search criteria.
                    </p>
                    <Button variant="outline" className="mt-5" onClick={resetFilters}>
                      Reset All Filters
                    </Button>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Button
                      key={p}
                      variant={p === currentPage ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

function FilterCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary" />
      <span>{label}</span>
    </label>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition-opacity hover:opacity-80"
    >
      {label}
      <X className="h-3 w-3" />
    </button>
  );
}
