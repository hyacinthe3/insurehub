import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BarChart3,
  Building2,
  FileCheck2,
  Handshake,
  LineChart,
  Users,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "For insurers & brokers — InsureHub partners",
  description:
    "List products, manage pricing, policies, claims and payouts, or grow a broker book with commission tracking on InsureHub.",
  openGraph: {
    title: "For insurers & brokers — InsureHub partners",
    description: "Distribution, underwriting tools, and commission tracking in one partner platform.",
  },
};

const insurerFeatures = [
  { icon: Building2, title: "Product & pricing studio", body: "Publish products, tiers, and rating rules; version pricing without engineering." },
  { icon: FileCheck2, title: "Policy & claims desk", body: "Issue certificates, triage claims, and settle with a full audit trail." },
  { icon: BarChart3, title: "Performance reporting", body: "Conversion, loss ratio, and channel mix by product and region." },
  { icon: Wallet, title: "Settlements", body: "Automated premium reconciliation and scheduled payouts." },
];

const brokerFeatures = [
  { icon: Users, title: "Client portfolios", body: "One view of every client, policy, renewal date, and open claim." },
  { icon: Handshake, title: "Assisted quoting", body: "Generate and send multi-insurer quotes on a client's behalf in minutes." },
  { icon: LineChart, title: "Commission tracking", body: "Earned, pending, and paid commission per policy and per insurer." },
];

export default function PartnersPage() {
  return (
    <>
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
          <span className="inline-flex items-center rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-semibold text-primary">
            Partner platform
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.08] sm:text-5xl">
            Distribution, operations, and reporting for insurers and brokers
          </h1>
          <p className="mt-5 max-w-2xl text-muted-foreground sm:text-lg">
            Reach customers already comparing cover, and run the whole book — products, policies,
            claims, payouts, and commissions — from dedicated dashboards.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg">
              Apply to list products <ArrowRight />
            </Button>
            <Button size="lg" variant="outline">
              Talk to partnerships
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <h2 className="text-3xl font-bold sm:text-4xl">For insurance companies</h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          A dedicated dashboard for products, pricing, policies, claims, customers, reports, and
          payments.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {insurerFeatures.map((f) => (
            <div key={f.title} className="surface p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <h2 className="text-3xl font-bold sm:text-4xl">For brokers and agents</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Support clients end to end, from first quote to renewal, with transparent commission.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {brokerFeatures.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-background p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="surface grid gap-8 p-8 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:p-12">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Onboarding takes about two weeks</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Licence verification, product mapping, rating integration, and a sandbox launch before
              you go live to customers. Existing rating APIs are supported.
            </p>
            <div className="mt-7">
              <Button asChild>
                <Link href="/browse">See how products appear to customers</Link>
              </Button>
            </div>
          </div>
          <ol className="space-y-3">
            {["Licence & compliance review", "Product and wording mapping", "Rating integration or manual pricing", "Sandbox test & go live"].map(
              (step, i) => (
                <li key={step} className="flex items-center gap-4 rounded-xl bg-muted px-5 py-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium">{step}</span>
                </li>
              ),
            )}
          </ol>
        </div>
      </section>
    </>
  );
}
