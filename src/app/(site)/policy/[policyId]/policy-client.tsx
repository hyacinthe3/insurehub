"use client";

import Link from "next/link";
import { BadgeCheck, Download, Mail, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { FlowError, FlowLoading } from "@/components/flow/flow-ui";
import { getPolicy } from "@/lib/api";
import { formatRwf } from "@/lib/insurance-data";
import type { IssuedPolicy } from "@/lib/quote-flow";

export default function PolicyClient({ policyId }: { policyId: string }) {
  const [state, setState] = useState<{ loading: boolean; policy: IssuedPolicy | null }>({
    loading: true,
    policy: null,
  });

  useEffect(() => {
    let cancelled = false;
    getPolicy(policyId)
      .then((policy) => {
        if (!cancelled) setState({ loading: false, policy });
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, policy: null });
      });
    return () => {
      cancelled = true;
    };
  }, [policyId]);

  if (state.loading) return <FlowLoading label="Loading your policy…" />;
  if (!state.policy)
    return (
      <FlowError
        title="Policy not found"
        body="We couldn't find this policy. Check My Policies in your dashboard."
        to="/dashboard/customer/policies"
        actionLabel="Go to My Policies"
      />
    );

  const p = state.policy;
  const certificate = [
    `INSUREHUB DIGITAL CERTIFICATE OF INSURANCE`,
    `Certificate: ${p.certificateId}`,
    `Policy number: ${p.policyNumber}`,
    `Product: ${p.planName} (${p.category})`,
    `Insurer: ${p.provider}`,
    `Policyholder: ${p.holder.fullName}`,
    `ID: ${p.holder.nationalId}`,
    `Premium: ${formatRwf(p.premium)} per month`,
    `Cover period: ${new Date(p.startDate).toDateString()} to ${new Date(p.endDate).toDateString()}`,
    `Payment reference: ${p.paymentReference}`,
  ].join("\n");

  const download = () => {
    const blob = new Blob([certificate], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${p.policyNumber}-certificate.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="px-5 py-12 lg:px-8">
      <div className="mx-auto w-full max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="surface p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-success/12">
            <BadgeCheck className="h-7 w-7 text-success" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">You're covered</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Payment confirmed and your policy is active. Policy number{" "}
            <span className="font-semibold text-foreground">{p.policyNumber}</span>.
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <Mail className="h-3.5 w-3.5" /> Certificate emailed to {p.holder.email}
          </p>
        </div>

        <div className="surface overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold">Policy schedule</h2>
          </div>
          <dl className="divide-y divide-border text-sm">
            {[
              ["Product", `${p.planName} · ${p.category}`],
              ["Insurer", p.provider],
              ["Policyholder", p.holder.fullName],
              ["Premium", `${formatRwf(p.premium)} / month`],
              ["Cover starts", new Date(p.startDate).toDateString()],
              ["Cover ends", new Date(p.endDate).toDateString()],
              ["Certificate", p.certificateId],
              ["Payment reference", p.paymentReference],
              ["Documents on file", p.documents.join(", ") || "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="max-w-[60%] break-words text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={download}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand"
          >
            <Download className="h-4 w-4" />
            Download certificate
          </button>
          <Link
            href="/dashboard/customer/policies"
            className="inline-flex items-center gap-2 rounded-full border border-input px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
          >
            <ShieldCheck className="h-4 w-4" />
            View in My Policies
          </Link>
          <Link
            href="/companies"
            className="inline-flex items-center rounded-full border border-input px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
          >
            Add more cover
          </Link>
        </div>
      </div>
    </section>
  );
}
