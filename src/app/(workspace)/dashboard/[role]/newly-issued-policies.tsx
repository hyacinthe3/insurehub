"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { StatusPill } from "@/components/dashboard/ui-bits";
import { listPolicies } from "@/lib/api";
import { formatRwf } from "@/lib/insurance-data";
import type { IssuedPolicy } from "@/lib/quote-flow";

/** Policies bought through the marketplace flow on this device. */
export default function NewlyIssuedPolicies() {
  const [policies, setPolicies] = useState<IssuedPolicy[]>([]);

  useEffect(() => {
    let cancelled = false;
    listPolicies().then((items) => {
      if (!cancelled) setPolicies(items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (policies.length === 0) return null;

  return (
    <section className="surface overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold">Just purchased</h2>
        <p className="text-sm text-muted-foreground">Policies you bought and paid for on InsureHub.</p>
      </div>
      <ul className="divide-y divide-border">
        {policies.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="min-w-0">
              <p className="truncate font-semibold">{p.planName}</p>
              <p className="text-xs text-muted-foreground">
                {p.provider} · {p.policyNumber} · {formatRwf(p.premium)}/mo
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill label="Active" tone="success" />
              <Link
                href={`/policy/${p.id}`}
                className="rounded-full border border-input px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-accent"
              >
                Certificate
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
