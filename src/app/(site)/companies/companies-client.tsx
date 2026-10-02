"use client";

import Link from "next/link";
import { ArrowUpRight, Building2, Clock3, MapPin, Search, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { formatRwf } from "@/lib/insurance-data";
import { getMarketplaceProducts, getMarketplaceCompanies, type MarketplaceProduct, type MarketplaceCompany } from "@/lib/api";

export default function CompaniesClient() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [companies, setCompanies] = useState<MarketplaceCompany[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getMarketplaceProducts(), getMarketplaceCompanies()])
      .then(([productList, companyList]) => {
        if (cancelled) return;
        setProducts(productList);
        setCompanies(companyList);
      })
      .catch(() => {
        if (!cancelled) {
          setProducts([]);
          setCompanies([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const productsByProvider = useMemo(() => {
    const map = new Map<string, MarketplaceProduct[]>();
    for (const p of products) {
      const arr = map.get(p.provider) ?? [];
      arr.push(p);
      map.set(p.provider, arr);
    }
    return map;
  }, [products]);

  const results = companies
    .filter((c) => {
      const haystack = `${c.name} ${c.tagline} ${c.accent} ${c.headquarters}`.toLowerCase();
      return haystack.includes(query.trim().toLowerCase());
    });

  return (
    <section className="px-5 py-12 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Providers</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Insurance companies on InsureHub</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Every provider here is licensed by the National Bank of Rwanda. Pick a company to see their products,
            get a quote and buy online — all premiums in RWF.
          </p>
        </div>

        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search providers by name or speciality"
            aria-label="Search insurance companies"
            className="h-12 w-full rounded-full border border-input bg-card pl-11 pr-4 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {loading ? (
          <div className="surface p-12 text-center">
            <p className="font-semibold">Loading providers…</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Fetching approved insurance companies from the marketplace.
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="surface p-12 text-center">
            <p className="font-semibold">No providers match "{query}"</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a category like motor, health or fleet.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {results.map((company) => {
              const companyProducts = productsByProvider.get(company.name) ?? [];
              const cheapest = companyProducts.reduce<number | null>(
                (min, p) => (min === null || p.monthly < min ? p.monthly : min),
                null,
              );
              return (
                <Link
                  key={company.slug}
                  href={`/companies/${company.slug}`}
                  className="surface group flex flex-col gap-4 p-5 transition-shadow hover:shadow-lift"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{company.name}</p>
                      <p className="text-xs text-muted-foreground">{company.accent}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{company.tagline}</p>
                  <dl className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-warning-foreground" />
                      <span className="font-semibold">{company.rating}</span>
                      <span className="text-muted-foreground">rating</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5 text-primary" />
                      <span className="font-semibold">{company.avgClaimDays}d</span>
                      <span className="text-muted-foreground">claims</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {company.headquarters}
                    </div>
                  </dl>
                  <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-sm">
                    <span className="text-muted-foreground">
                      {company.productCount} product{company.productCount === 1 ? "" : "s"}
                      {cheapest !== null && ` · from ${formatRwf(cheapest)}/mo`}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-primary">
                      View
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
