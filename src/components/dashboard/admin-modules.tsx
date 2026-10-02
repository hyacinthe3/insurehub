"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Briefcase,
  Building2,
  Package,
  ScrollText,
  TrendingUp,
  UserCheck,
  UserX,
  Users,
  Wallet,
} from "lucide-react";

import {
  EmptyState,
  SectionCard,
  type TableCell,
} from "@/components/dashboard/ui-bits";
import { PaginatedDataTable } from "@/components/dashboard/paginated-data-table";
import {
  getAdminBrokers,
  getAdminCustomers,
  getAdminProducts,
  type AdminBroker,
  type AdminCustomer,
  type AdminProduct,
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

type StatCardProps = {
  icon: typeof Users;
  label: string;
  value: string | number;
  delta?: string;
  tone?: "primary" | "success" | "warning" | "danger";
};

function AdminStatCard({ icon: Icon, label, value, delta, tone = "primary" }: StatCardProps) {
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

function LoadError({ title }: { title: string }) {
  return (
    <SectionCard title={title}>
      <p className="flex items-center gap-2 px-5 py-8 text-sm text-muted-foreground">
        No results found.
      </p>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Brokers                                                             */
/* ------------------------------------------------------------------ */

export function AdminBrokers() {
  const { data, error } = useData<AdminBroker[]>(getAdminBrokers);
  if (error) return <LoadError title="Broker Agencies" />;
  if (!data)
    return (
      <SectionCard title="Broker Agencies">
        <p className="px-5 py-8 text-sm text-muted-foreground">Loading broker agencies…</p>
      </SectionCard>
    );

  const active = data.filter((b) => b.active).length;
  const suspended = data.length - active;
  const totalPolicies = data.reduce((a, b) => a + b.policyCount, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard icon={Briefcase} label="Broker Agencies" value={String(data.length)} delta="registered on platform" tone="primary" />
        <AdminStatCard icon={UserCheck} label="Active Brokers" value={String(active)} delta="can sign in & trade" tone="success" />
        <AdminStatCard icon={UserX} label="Suspended" value={String(suspended)} delta="blocked from sign-in" tone={suspended > 0 ? "danger" : "success"} />
        <AdminStatCard icon={ScrollText} label="Policies on Book" value={String(totalPolicies)} delta="across all brokers" tone="primary" />
      </div>

      <SectionCard
        title="Broker Register"
        description={`${data.length} broker agencies handling policies across the platform.`}
      >
        {data.length === 0 ? (
          <EmptyState title="No brokers yet" body="Broker agencies that register on InsureHub will appear here." />
        ) : (
          <PaginatedDataTable
            columns={["Agency", "Contact Email", "Phone", "Policies", "Joined", "Status"]}
            rows={data.map(
              (b): TableCell[] => [
                b.name,
                b.email,
                b.phone ?? "—",
                String(b.policyCount),
                fmtDate(b.since),
                b.active ? { pill: "Active", tone: "success" } : { pill: "Suspended", tone: "danger" },
              ],
            )}
          />
        )}
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Customers                                                           */
/* ------------------------------------------------------------------ */

export function AdminCustomers() {
  const { data, error } = useData<AdminCustomer[]>(getAdminCustomers);
  if (error) return <LoadError title="Customers" />;
  if (!data)
    return (
      <SectionCard title="Customers">
        <p className="px-5 py-8 text-sm text-muted-foreground">Loading customer accounts…</p>
      </SectionCard>
    );

  const individuals = data.filter((c) => c.type === "Individual").length;
  const businesses = data.filter((c) => c.type === "Business").length;
  const active = data.filter((c) => c.active).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard icon={Users} label="Total Accounts" value={String(data.length)} delta="individuals + businesses" tone="primary" />
        <AdminStatCard icon={Building2} label="Individuals" value={String(individuals)} delta="personal accounts" tone="primary" />
        <AdminStatCard icon={Wallet} label="Businesses" value={String(businesses)} delta="company accounts" tone="success" />
        <AdminStatCard icon={UserCheck} label="Active Accounts" value={String(active)} delta="can sign in" tone={active === data.length ? "success" : "warning"} />
      </div>

      <SectionCard
        title="Customer Register"
        description={`Every individual and business account on InsureHub (${data.length} total).`}
      >
        {data.length === 0 ? (
          <EmptyState title="No customers yet" body="Customer and business accounts appear here as people sign up." />
        ) : (
          <PaginatedDataTable
            columns={["Account", "Email", "Phone", "Type", "Policies", "Joined", "Status"]}
            rows={data.map(
              (c): TableCell[] => [
                c.name,
                c.email,
                c.phone ?? "—",
                c.type,
                String(c.policyCount),
                fmtDate(c.since),
                c.active ? { pill: "Active", tone: "success" } : { pill: "Suspended", tone: "danger" },
              ],
            )}
          />
        )}
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

export function AdminProducts() {
  const { data, error } = useData<AdminProduct[]>(getAdminProducts);
  if (error) return <LoadError title="Products" />;
  if (!data)
    return (
      <SectionCard title="Products">
        <p className="px-5 py-8 text-sm text-muted-foreground">Loading marketplace products…</p>
      </SectionCard>
    );

  const totalPolicies = data.reduce((a, p) => a + p.policyCount, 0);
  const fromActive = data.filter((p) => p.providerStatus === "active").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard icon={Package} label="Live Products" value={String(data.length)} delta="all marketplace listings" tone="primary" />
        <AdminStatCard icon={TrendingUp} label="From Active Carriers" value={String(fromActive)} delta="carriers not suspended" tone="success" />
        <AdminStatCard icon={ScrollText} label="Policies Sold" value={String(totalPolicies)} delta="across all listings" tone="primary" />
      </div>

      <SectionCard
        title="Marketplace Product Register"
        description="Every product listing across all carriers, with live policy counts."
      >
        {data.length === 0 ? (
          <EmptyState title="No products listed" body="Products carriers publish on InsureHub will appear here." />
        ) : (
          <PaginatedDataTable
            columns={["Product", "Company", "Category", "Base Monthly", "Policies", "Carrier"]}
            rows={data.map(
              (p): TableCell[] => [
                p.name,
                p.provider,
                p.category,
                formatRwf(p.monthly, { compact: true }),
                String(p.policyCount),
                p.providerStatus === "active"
                  ? { pill: "Active", tone: "success" }
                  : { pill: "Suspended", tone: "danger" },
              ],
            )}
          />
        )}
      </SectionCard>
    </div>
  );
}
