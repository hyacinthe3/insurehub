import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  FileText,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { categories as staticCategories, formatRwf } from "@/lib/insurance-data";
import {
  getMarketplaceCategories,
  getMarketplaceProducts,
  type MarketplaceCategory,
  type MarketplaceProduct,
} from "@/lib/api";

export const metadata: Metadata = {
  title: "InsureHub — Compare insurance from every provider",
  description:
    "Compare, buy, and manage insurance across motor, health, travel, home, business and 18+ categories from regulated providers in one marketplace.",
  openGraph: {
    title: "InsureHub — Compare insurance from every provider",
    description:
      "One marketplace to compare quotes, buy cover, get digital certificates, and track claims.",
  },
};

const steps = [
  { icon: Search, title: "Tell us what to cover", body: "Answer a handful of questions. No forms, no phone calls, no jargon." },
  { icon: SlidersHorizontal, title: "Compare real quotes", body: "Live pricing from every listed provider, ranked side by side on cover, not ads." },
  { icon: Wallet, title: "Buy and pay online", body: "Card, bank transfer, or instalments. Cover activates the moment payment clears." },
  { icon: FileText, title: "Manage, claim, renew", body: "Digital certificates, claim tracking, and one-tap renewals in your dashboard." },
];

const stats = [
  { value: "18+", label: "Insurance categories" },
  { value: "640+", label: "Live products listed" },
  { value: "42", label: "Regulated providers" },
  { value: "2.4 days", label: "Median claim payout" },
];

export default async function HomePage() {
  let apiCategories: MarketplaceCategory[] = [];
  let products: MarketplaceProduct[] = [];
  try {
    [apiCategories, products] = await Promise.all([
      getMarketplaceCategories(),
      getMarketplaceProducts(),
    ]);
  } catch {
    apiCategories = [];
    products = [];
  }

  const providers = Array.from(new Set(products.map((p) => p.provider)));
  const featured = products
    .filter((p) => p.categorySlug === "motor")
    .sort((a, b) => b.coverAmount / b.monthly - a.coverAmount / a.monthly)
    .slice(0, 3);

  const categories = apiCategories.map((c) => ({
    ...c,
    icon: staticCategories.find((s) => s.slug === c.slug)?.icon ?? ShieldCheck,
  }));

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 py-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:px-8 lg:py-24">
          <div>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] text-balance-tight sm:text-5xl lg:text-6xl">
              Every insurance policy. One place to compare.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              InsureHub brings motor, health, life, travel, business and 14 more categories from
              regulated providers into a single marketplace — quote, buy, manage, and claim without
              leaving the platform.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/browse">
                  Browse insurance <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/compare">Compare policies</Link>
              </Button>
            </div>

            <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="text-2xl font-bold sm:text-[1.75rem]">{s.value}</dt>
                  <dd className="mt-1 text-xs text-muted-foreground">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="surface overflow-hidden p-3 shadow-lift">
            <Image
              src="/hero-marketplace.jpg"
              alt="InsureHub policy comparison cards and dashboard panels"
              width={1280}
              height={1024}
              priority
              className="w-full rounded-2xl"
            />
          </div>
        </div>
      </section>

      {/* Providers strip */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-10 gap-y-4 px-5 py-6 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Listing providers
          </span>
          {providers.map((p) => (
            <span key={p} className="text-sm font-semibold text-muted-foreground">
              {p}
            </span>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold sm:text-4xl">Cover for anything you need to protect</h2>
          <p className="mt-4 text-muted-foreground">
            Personal, commercial, and specialty lines — each category opens onto live products with
            transparent pricing and cover limits.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.slice(0, 12).map((cat) => (
            <Link
              key={cat.slug}
              href="/browse"
              className="surface group p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-lift"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <cat.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">{cat.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{cat.blurb}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>{cat.productCount} products</span>
                <span className="font-semibold text-primary">from {cat.from}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <Button variant="outline" asChild>
            <Link href="/browse">
              See all 18 categories <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold sm:text-4xl">From question to certificate in minutes</h2>
            <p className="mt-4 text-muted-foreground">
              The whole lifecycle lives on one platform — quoting, payment, documents, claims, and
              renewal reminders.
            </p>
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <li key={step.title} className="rounded-2xl border border-border bg-background p-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Featured quotes */}
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold sm:text-4xl">Live motor quotes, ranked honestly</h2>
            <p className="mt-4 text-muted-foreground">
              Sorted by value, not commission. Every card shows the excess and average claim time
              before you commit.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/compare">Compare in detail</Link>
          </Button>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {featured.map((plan) => (
            <article key={plan.id} className="surface flex flex-col p-6 transition-shadow hover:shadow-lift">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-muted-foreground">
                    {plan.provider}
                  </p>
                  <h3 className="mt-1 text-lg font-bold">{plan.name}</h3>
                </div>
                {plan.badge && (
                  <span className="shrink-0 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-accent-foreground">
                    {plan.badge}
                  </span>
                )}
              </div>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold">{formatRwf(plan.monthly)}</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>

              <dl className="mt-5 grid grid-cols-3 gap-3 rounded-2xl bg-muted p-4 text-center">
                {[
                  ["Cover", formatRwf(plan.coverAmount, { compact: true })],
                  ["Excess", formatRwf(plan.excessAmount)],
                  ["Claims", plan.claimDays],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[11px] text-muted-foreground">{label}</dt>
                    <dd className="mt-1 text-xs font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>

              <ul className="mt-5 space-y-2.5">
                {plan.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {h}
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex gap-2 border-t border-border pt-5">
                <Button className="flex-1" asChild>
                  <Link href="/compare">Get quote</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/compare">Details</Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-3 lg:px-8">
          {[
            {
              icon: ShieldCheck,
              title: "Only regulated providers",
              body: "Every insurer is licence-verified before listing, and product wording is reviewed for clarity.",
            },
            {
              icon: BadgeCheck,
              title: "No hidden loading",
              body: "You see the same premium the insurer files. InsureHub is paid by providers, never by inflating your price.",
            },
            {
              icon: FileText,
              title: "Documents that hold up",
              body: "Digital certificates are issued instantly and verifiable by third parties via a policy reference.",
            },
          ].map((item) => (
            <div key={item.title}>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                <item.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="rounded-3xl border border-border bg-primary px-6 py-14 text-center shadow-brand sm:px-14">
          <h2 className="mx-auto max-w-2xl text-3xl font-extrabold text-primary-foreground sm:text-4xl">
            Find better cover in the next five minutes
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-primary-foreground/80 sm:text-base">
            Start with one category, compare the whole market, and keep every policy in one account.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="outline" asChild>
              <Link href="/browse">
                Start comparing <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" asChild>
              <Link href="/partners">I'm an insurer or broker</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
