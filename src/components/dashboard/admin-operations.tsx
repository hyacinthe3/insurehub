"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  LifeBuoy,
  ScrollText,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { EmptyState, SectionCard, type TableCell } from "@/components/dashboard/ui-bits";
import { PaginatedDataTable } from "@/components/dashboard/paginated-data-table";
import {
  getAdminClaims,
  getAdminPolicies,
  type AdminClaim,
  type AdminPolicy,
} from "@/lib/api";
import { formatRwf } from "@/lib/insurance-data";
import { cn } from "@/lib/utils";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function useData<T>(loader: () => Promise<T>): { data: T | null; error: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    loader()
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [loader]);
  return { data, error };
}

function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  tone = "primary",
}: {
  icon: typeof ScrollText;
  label: string;
  value: string | number;
  delta?: string;
  tone?: "primary" | "success" | "warning" | "danger";
}) {
  const tones = {
    primary: { icon: "bg-primary/10 text-primary", value: "text-foreground" },
    success: { icon: "bg-success/10 text-success", value: "text-success" },
    warning: { icon: "bg-warning/12 text-warning-foreground", value: "text-warning-foreground" },
    danger: { icon: "bg-destructive/10 text-destructive", value: "text-destructive" },
  }[tone];

  return (
    <div className="surface flex h-full flex-col gap-3 p-5 transition-shadow hover:shadow-lift">
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", tones.icon)}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={cn("mt-1 text-2xl font-bold tracking-tight", tones.value)}>{value}</p>
        {delta && <p className="mt-0.5 text-xs text-muted-foreground">{delta}</p>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Admin Policies                                                       */
/* ------------------------------------------------------------------ */

export function AdminPolicies() {
  const { data, error } = useData<AdminPolicy[]>(getAdminPolicies);
  if (error) return <LoadError title="Policies" />;
  if (!data)
    return (
      <SectionCard title="Policies">
        <p className="px-5 py-8 text-sm text-muted-foreground">Loading policies…</p>
      </SectionCard>
    );

  const active = data.filter((p) => p.active).length;
  const totalPremium = data.reduce((a, p) => a + p.premium, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ScrollText} label="Policies in Force" value={String(active)} delta={`${data.length} total issued`} tone="success" />
        <StatCard icon={Activity} label="Lapsed / Expired" value={String(data.length - active)} delta="no longer active" tone="warning" />
        <StatCard icon={ShieldCheck} label="Total Policies" value={String(data.length)} delta="lifetime on book" tone="primary" />
        <StatCard icon={Wallet} label="Gross Written Premium" value={formatRwf(totalPremium, { compact: true })} delta="all policies" tone="primary" />
      </div>

      <SectionCard title="Policy Register" description="Every policy in force across the marketplace.">
        {data.length === 0 ? (
          <EmptyState title="No policies yet" body="Policies appear as carriers convert marketplace quotes." />
        ) : (
          <PaginatedDataTable
            columns={["Policy No.", "Customer", "Company", "Product", "Premium", "Status"]}
            rows={data.map(
              (p): TableCell[] => [
                p.policyNumber,
                p.holderName,
                p.provider,
                p.planName,
                formatRwf(p.premium),
                p.active ? { pill: "In force", tone: "success" } : { pill: "Expired", tone: "neutral" },
              ],
            )}
          />
        )}
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Admin Claims                                                         */
/* ------------------------------------------------------------------ */

const claimTone: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  paid: "success",
  approved: "success",
  under_review: "warning",
  submitted: "info",
  rejected: "danger",
};

export function AdminClaims() {
  const { data, error } = useData<AdminClaim[]>(getAdminClaims);
  if (error) return <LoadError title="Claims" />;
  if (!data)
    return (
      <SectionCard title="Claims">
        <p className="px-5 py-8 text-sm text-muted-foreground">Loading claims…</p>
      </SectionCard>
    );

  const pending = data.filter((c) => c.status === "submitted" || c.status === "under_review").length;
  const approved = data.filter((c) => c.status === "approved" || c.status === "paid").length;
  const total = data.reduce((a, c) => a + c.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Clock} label="Open Claims" value={String(pending)} delta="awaiting review/decision" tone={pending > 0 ? "warning" : "success"} />
        <StatCard icon={CheckCircle2} label="Settled" value={String(approved)} delta="approved or paid out" tone="success" />
        <StatCard icon={Wallet} label="Total Value Claimed" value={formatRwf(total, { compact: true })} delta="recorded" tone="primary" />
        <StatCard icon={LifeBuoy} label="Total Claim Cases" value={String(data.length)} delta="platform-wide" tone="primary" />
      </div>

      <SectionCard title="Claims Register" description="Claims filed across every carrier on the marketplace.">
        {data.length === 0 ? (
          <EmptyState title="No claims yet" body="Claims raised on marketplace policies will appear here." />
        ) : (
          <PaginatedDataTable
            columns={["Reference", "Policy No.", "Policyholder", "Company", "Status", "Claim Amount", "Date Logged"]}
            rows={data.map(
              (c): TableCell[] => [
                c.reference,
                c.policyNumber,
                c.holderName,
                c.provider,
                { pill: c.status.replace(/_/g, " "), tone: claimTone[c.status] ?? "neutral" },
                formatRwf(c.amount),
                fmtDate(c.createdAt),
              ],
            )}
          />
        )}
      </SectionCard>
    </div>
  );
}

function LoadError({ title }: { title: string }) {
  return (
    <SectionCard title={title}>
      <p className="flex items-center gap-2 px-5 py-8 text-sm text-muted-foreground">
        No results found.
      </p>
    </SectionCard>
  );
}
