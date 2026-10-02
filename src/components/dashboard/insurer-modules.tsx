"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  LifeBuoy,
  Package,
  RefreshCw,
  ScrollText,
  Save,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import {
  EmptyState,
  SectionCard,
  type TableCell,
} from "@/components/dashboard/ui-bits";
import { PaginatedDataTable } from "@/components/dashboard/paginated-data-table";
import { ProductQuestionsModal } from "@/components/dashboard/product-questions";
import {
  createInsurerProduct,
  deleteInsurerProduct,
  getInsurerCategories,
  getInsurerClaims,
  getInsurerCustomers,
  getInsurerNotifications,
  getInsurerOverview,
  getInsurerPayments,
  getInsurerPolicies,
  getInsurerProducts,
  getInsurerReports,
  markAllInsurerNotificationsRead,
  markInsurerNotificationRead,
  publishInsurerProduct,
  submitInsurerProduct,
  unpublishInsurerProduct,
  updateInsurerProduct,
  type InsurerCategory,
  type InsurerClaim,
  type InsurerCustomer,
  type InsurerNotification,
  type InsurerOverview as InsurerOverviewData,
  type InsurerPolicy,
  type InsurerProduct,
  type InsurerReport,
  type InsurerSettlement,
  ApiError,
} from "@/lib/api";
import { formatRwf } from "@/lib/insurance-data";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/dashboard/ui-bits";
import { X } from "lucide-react";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const fmtMonthYear = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" });

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

function useRefreshableData<T>(loader: () => Promise<T>): {
  data: T | null;
  error: boolean;
  refresh: () => void;
} {
  const [tick, setTick] = useState(0);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setData(null);
    loader()
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);
  const refresh = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, refresh };
}

/* ------------------------------------------------------------------ */
/* Rich Stat Card for Insurer Dashboard                                */
/* ------------------------------------------------------------------ */

type RichStatCardProps = {
  icon: typeof Package;
  label: string;
  value: string | number;
  delta?: string;
  tone?: "primary" | "success" | "warning" | "danger";
  badge?: string;
};

function RichInsurerStatCard({ icon: Icon, label, value, delta, tone = "primary", badge }: RichStatCardProps) {
  const tones = {
    primary: { icon: "bg-primary/10 text-primary", value: "text-foreground" },
    success: { icon: "bg-success/10 text-success", value: "text-success" },
    warning: { icon: "bg-warning/12 text-warning-foreground", value: "text-warning-foreground" },
    danger: { icon: "bg-destructive/10 text-destructive", value: "text-destructive" },
  }[tone];

  return (
    <div className="surface p-5 flex flex-col gap-3 hover:shadow-lift transition-shadow group h-full">
      <div className="flex items-start justify-between">
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", tones.icon)}>
          <Icon className="h-5 w-5" />
        </span>
        {badge && (
          <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground animate-pulse">
            {badge}
          </span>
        )}
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={cn("mt-1 text-2xl font-bold tracking-tight", tones.value)}>{value}</p>
        {delta && <p className="mt-0.5 text-xs text-muted-foreground">{delta}</p>}
      </div>
    </div>
  );
}

type CompactStatCardProps = {
  icon: typeof Package;
  label: string;
  value: string | number;
  tone?: "primary" | "success" | "warning" | "danger";
};

function CompactStatCard({ icon: Icon, label, value, tone = "primary" }: CompactStatCardProps) {
  const tones = {
    primary: { icon: "bg-primary/10 text-primary" },
    success: { icon: "bg-success/10 text-success" },
    warning: { icon: "bg-warning/12 text-warning-foreground" },
    danger: { icon: "bg-destructive/10 text-destructive" },
  }[tone];

  return (
    <div className="surface flex max-w-full min-w-0 items-center gap-2.5 px-3 py-2.5">
      <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", tones.icon)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-bold leading-tight text-foreground">{value}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Insurer Overview Component                                          */
/* ------------------------------------------------------------------ */

export function InsurerOverview() {
  const { data, error, refresh } = useRefreshableData<InsurerOverviewData>(getInsurerOverview);

  if (error) {
    return (
      <div className="surface p-8 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm font-semibold text-foreground">No results found.</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          We couldn&apos;t load your latest operational data. If this keeps happening, make sure the
          backend is up to date and running.
        </p>
        <button
          type="button"
          onClick={refresh}
          className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-brand hover:bg-primary/90"
        >
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="surface p-5 space-y-3 animate-pulse">
              <div className="h-10 w-10 rounded-xl bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
              <div className="h-7 w-1/3 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const t = data.totals;

  return (
    <div className="space-y-6">
      {/* Company Header Card */}
      {data.provider && (
        <div className="surface p-6 bg-gradient-to-r from-card via-card to-primary-soft/30 border-primary/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground font-bold text-xl shadow-brand">
                {data.provider.name ? data.provider.name[0] : "I"}
              </span>
              <div>
                <h2 className="text-xl font-bold">{data.provider.name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  License: <span className="font-mono text-foreground font-medium">{data.provider.license}</span> · Rating: <span className="text-amber-500 font-semibold">★ {data.provider.rating}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                <ShieldCheck className="h-3.5 w-3.5" /> Licensed Insurer
              </span>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RichInsurerStatCard
          icon={Package}
          label="Active Products"
          value={(t.products ?? 0).toLocaleString()}
          delta="Published catalog lines"
          tone="primary"
        />
        <RichInsurerStatCard
          icon={ScrollText}
          label="Policies in Force"
          value={(t.activePolicies ?? 0).toLocaleString()}
          delta={`${t.policies ?? 0} lifetime issued`}
          tone="success"
        />
        <RichInsurerStatCard
          icon={TrendingUp}
          label="30-Day Gross Premium"
          value={formatRwf(t.premium30d ?? 0, { compact: true })}
          delta={`${t.pendingClaims ?? 0} claims pending review`}
          tone="primary"
        />
        <RichInsurerStatCard
          icon={Wallet}
          label="30-Day Collections"
          value={formatRwf(t.collected30d ?? 0, { compact: true })}
          delta={`${t.paidClaims30d ?? 0} claims paid out`}
          tone="success"
        />
      </div>

      {/* Renewals Due Section */}
      {data.renewalsDue && data.renewalsDue.length > 0 && (
        <SectionCard title="Renewals Due (30 Days)" description="Policies expiring in the next 30 days requiring attention.">
          <PaginatedDataTable
            columns={["Policy No.", "Holder Name", "Plan", "Premium", "Expiry Date", "Status"]}
            rows={data.renewalsDue.map(
              (r): TableCell[] => [
                r.policyNumber,
                r.holderName,
                r.planName,
                formatRwf(r.premium),
                fmtDate(r.endDate),
                { pill: "Renewal Due", tone: "warning" },
              ],
            )}
          />
        </SectionCard>
      )}

      {/* Recent Claims Section */}
      {data.recentClaims && data.recentClaims.length > 0 && (
        <SectionCard title="Recent Claims Submitted" description="Latest claims reported against your policies.">
          <PaginatedDataTable
            columns={["Reference", "Policy", "Holder", "Status", "Amount", "Reported Date"]}
            rows={data.recentClaims.map(
              (c): TableCell[] => [
                c.reference,
                c.policyNumber,
                c.holderName,
                { pill: c.status.replace(/_/g, " "), tone: c.status === "paid" || c.status === "approved" ? "success" : c.status === "rejected" ? "danger" : "info" },
                formatRwf(c.amount),
                fmtDate(c.createdAt),
              ],
            )}
          />
        </SectionCard>
      )}

      <InsurerNotifications />
    </div>
  );
}

const statusMeta: Record<
  string,
  { label: string; tone: "success" | "warning" | "danger" | "info" | "neutral" }
> = {
  draft: { label: "Draft", tone: "neutral" },
  pending_review: { label: "Pending Review", tone: "warning" },
  approved: { label: "Approved", tone: "info" },
  published: { label: "Published", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
};

const productStatusTone = (s: string) => statusMeta[s]?.tone ?? "neutral";
const productStatusLabel = (s: string) => statusMeta[s]?.label ?? s;

function ProductStatusBadge({ status }: { status: string }) {
  return <StatusPill label={productStatusLabel(status)} tone={productStatusTone(status)} />;
}

export function InsurerProducts() {
  const { data, error, refresh } = useRefreshableData<InsurerProduct[]>(getInsurerProducts);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<InsurerProduct | null>(null);
  const [viewing, setViewing] = useState<InsurerProduct | null>(null);
  const [deleting, setDeleting] = useState<InsurerProduct | null>(null);
  const [questionsProduct, setQuestionsProduct] = useState<InsurerProduct | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const products = data ?? [];
  const loading = !data && !error;

  useEffect(() => {
    if (!toast || toast.tone !== "success") return;
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  const counts = (s: string) => products.filter((p) => p.status === s).length;

  const runAction = async (label: string, fn: () => Promise<unknown>) => {
    setToast(null);
    try {
      await fn();
      setToast({ message: `${label} completed`, tone: "success" });
      refresh();
    } catch (err) {
      const detail = err instanceof ApiError ? err.message : "";
      setToast({
        message: detail ? `${label} failed — ${detail}` : `${label} failed — please try again`,
        tone: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={cn(
            "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium",
            toast.tone === "success"
              ? "border border-success/30 bg-success/10 text-success"
              : "border border-destructive/30 bg-destructive/10 text-destructive",
          )}
        >
          <span className="flex items-center gap-2">
            {toast.tone === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}{" "}
            {toast.message}
          </span>
          <button type="button" onClick={() => setToast(null)} className="text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-brand hover:bg-primary/90"
        >
          <Package className="h-4 w-4" /> New Product
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <CompactStatCard icon={Package} label="Total Products" value={String(products.length)} tone="primary" />
        <CompactStatCard icon={CheckCircle2} label="Published" value={String(counts("published"))} tone="success" />
        <CompactStatCard icon={Clock} label="Pending Review" value={String(counts("pending_review"))} tone={counts("pending_review") > 0 ? "warning" : "success"} />
        <CompactStatCard icon={AlertCircle} label="Drafts" value={String(counts("draft"))} tone="primary" />
      </div>

      <SectionCard
        title="Product Catalogue"
        description="Create, manage and lifecycle your insurance lines before they reach the marketplace."
      >
        {loading ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">Loading your catalogue…</p>
        ) : products.length === 0 ? (
          <EmptyState
            title="No results found"
            body="Your company has no products yet. Add your first insurance line below."
          />
        ) : (
          <PaginatedDataTable
            columns={["Product", "Category", "Monthly Premium", "Status", "Date"]}
            rows={products.map(
              (p): TableCell[] => [
                p.name,
                p.category,
                formatRwf(p.monthly, { compact: true }),
                { pill: productStatusLabel(p.status), tone: productStatusTone(p.status) },
                p.submittedAt ? fmtDate(p.submittedAt) : "Not submitted",
              ],
            )}
            rowActions={["Questions", "View", "Edit", "Delete"]}
            rowActionDisabled={(i, action) =>
              action === "Edit"
                ? products[i].status !== "draft" && products[i].status !== "rejected"
                : action === "Delete"
                  ? !["draft", "pending_review", "rejected"].includes(products[i].status)
                  : false
            }
            onRowAction={(i, action) => {
              const p = products[i];
              if (action === "Questions") setQuestionsProduct(p);
              if (action === "View") setViewing(p);
              if (action === "Edit") setEditing(p);
              if (action === "Delete") setDeleting(p);
            }}
          />
        )}
      </SectionCard>

      {questionsProduct && (
        <ProductQuestionsModal
          product={{ id: questionsProduct.id, name: questionsProduct.name }}
          onClose={() => setQuestionsProduct(null)}
        />
      )}

      {creating && (
        <ProductEditor
          onClose={() => setCreating(false)}
          onSaved={async (payload) => {
            await runAction("Product created", () => createInsurerProduct(payload));
            setCreating(false);
          }}
        />
      )}

      {editing && (
        <ProductEditor
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={async (payload) => {
            await runAction("Product updated", () => updateInsurerProduct(editing.id, payload));
            setEditing(null);
          }}
        />
      )}

      {viewing && (
        <ProductDetailModal
          product={viewing}
          onClose={() => setViewing(null)}
          onAction={async (label, fn) => {
            await runAction(label, fn);
            setViewing(null);
          }}
        />
      )}

      {deleting && (
        <ModalShell
          title="Delete product?"
          subtitle={`"${deleting.name}" will be permanently removed from your catalogue.`}
          onClose={() => setDeleting(null)}
        >
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. Products with active policies cannot be deleted.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="rounded-full border border-input px-4 py-2 text-sm font-semibold hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const product = deleting;
                  setDeleting(null);
                  await runAction("Deletion completed", () => deleteInsurerProduct(product.id));
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90"
              >
                <Trash2 className="h-4 w-4" /> Delete product
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

export function InsurerCustomers() {
  const { data, error } = useData<InsurerCustomer[]>(getInsurerCustomers);
  if (error)
    return (
      <SectionCard title="Policyholders">
        <p className="px-5 py-8 text-sm text-muted-foreground">No results found.</p>
      </SectionCard>
    );
  if (!data)
    return (
      <SectionCard title="Policyholders">
        <p className="px-5 py-8 text-sm text-muted-foreground">Loading your policyholders…</p>
      </SectionCard>
    );
  return (
    <SectionCard
      title="Policyholders Directory"
      description={`${data.length} unique insured entities on your active book.`}
    >
      {data.length === 0 ? (
        <EmptyState title="No customers yet" body="Customers who buy your products will appear here." />
      ) : (
        <PaginatedDataTable
          columns={["Customer Name", "Email Address", "Policies", "Annual Premium", "Customer Since", "Type"]}
          rows={data.map(
            (c): TableCell[] => [
              c.name,
              c.email,
              String(c.policyCount),
              formatRwf(c.premiumTotal),
              fmtMonthYear(c.since),
              c.type,
            ],
          )}
        />
      )}
    </SectionCard>
  );
}

export function InsurerPolicies() {
  const { data, error } = useData<InsurerPolicy[]>(getInsurerPolicies);
  if (error) return <p className="text-sm text-muted-foreground">No results found.</p>;
  if (!data) return <p className="text-sm text-muted-foreground">Loading your policies…</p>;
  const active = data.filter((p) => p.active).length;
  const premium30 = data.slice(0, 30).reduce((a, p) => a + p.premium, 0);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RichInsurerStatCard icon={ScrollText} label="Active Policies" value={String(active)} delta={`${data.length} total issued`} tone="success" />
        <RichInsurerStatCard icon={ShieldCheck} label="Coverage Rate" value={data.length ? `${Math.round((active / data.length) * 100)}%` : "0%"} delta="in force" tone="primary" />
        <RichInsurerStatCard icon={Wallet} label="Recent Premium Book" value={formatRwf(premium30, { compact: true })} delta="recently collected" tone="primary" />
        <RichInsurerStatCard icon={Activity} label="Lapsed / Expired" value={String(data.length - active)} delta="no longer active" tone="warning" />
      </div>
      <SectionCard title="Policies Register" description="Comprehensive register of policies underwritten by your organization.">
        {data.length === 0 ? (
          <EmptyState title="No policies yet" body="Policies issued for your products will appear here." />
        ) : (
          <PaginatedDataTable
            columns={["Policy No.", "Customer", "Product Plan", "Premium", "Inception Date", "Status"]}
            rows={data.map(
              (p): TableCell[] => [
                p.policyNumber,
                p.holderName,
                p.planName,
                formatRwf(p.premium),
                fmtDate(p.startDate),
                p.active ? { pill: "Active", tone: "success" } : { pill: "Expired", tone: "neutral" },
              ],
            )}
          />
        )}
      </SectionCard>
    </div>
  );
}

const claimTone: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  paid: "success",
  approved: "success",
  under_review: "warning",
  submitted: "info",
  rejected: "danger",
};

export function InsurerClaims() {
  const { data, error } = useData<InsurerClaim[]>(getInsurerClaims);
  if (error) return <p className="text-sm text-muted-foreground">No results found.</p>;
  if (!data) return <p className="text-sm text-muted-foreground">Loading your claims…</p>;
  const pending = data.filter((c) => c.status === "submitted" || c.status === "under_review").length;
  const paid30 = data.filter((c) => c.status === "paid").length;
  const total = data.reduce((a, c) => a + c.amount, 0);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RichInsurerStatCard icon={Clock} label="Open Claims" value={String(pending)} delta="awaiting review/decision" tone={pending > 0 ? "warning" : "success"} />
        <RichInsurerStatCard icon={CheckCircle2} label="Claims Settled" value={String(paid30)} delta="paid out" tone="success" />
        <RichInsurerStatCard icon={Wallet} label="Total Value Claimed" value={formatRwf(total, { compact: true })} delta="lifetime" tone="primary" />
        <RichInsurerStatCard icon={LifeBuoy} label="Total Claim Cases" value={String(data.length)} delta="recorded on book" tone="primary" />
      </div>
      <SectionCard title="Claims Management Register" description="Track and process claims lodged against your policies.">
        {data.length === 0 ? (
          <EmptyState title="No claims yet" body="Claims raised on your products will appear here." />
        ) : (
          <PaginatedDataTable
            columns={["Reference", "Policy No.", "Policyholder", "Status", "Claim Amount", "Date Logged"]}
            rows={data.map(
              (c): TableCell[] => [
                c.reference,
                c.policyNumber,
                c.holderName,
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

export function InsurerReports() {
  const { data, error } = useData<InsurerReport[]>(getInsurerReports);
  if (error)
    return (
      <SectionCard title="Available Reports">
        <p className="px-5 py-8 text-sm text-muted-foreground">No results found.</p>
      </SectionCard>
    );
  if (!data)
    return (
      <SectionCard title="Available Reports">
        <p className="px-5 py-8 text-sm text-muted-foreground">Loading reports…</p>
      </SectionCard>
    );
  return (
    <SectionCard title="Available Financial & Analytics Reports" description="Underwriting and operational reports compiled from your book.">
      <PaginatedDataTable
        columns={["Report Name", "Description", "Coverage Period", "Actions"]}
        rows={data.map(
          (r): TableCell[] => [r.title, r.description, r.period, "Run"],
        )}
        rowActions={["Run", "Export"]}
      />
    </SectionCard>
  );
}

export function InsurerPayments() {
  const { data, error } = useData<InsurerSettlement[]>(getInsurerPayments);
  if (error) return <p className="text-sm text-muted-foreground">No results found.</p>;
  if (!data) return <p className="text-sm text-muted-foreground">Loading settlements…</p>;
  const collected = data.reduce((a, s) => a + s.amount, 0);
  const pending = data.filter((s) => s.status === "pending").length;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RichInsurerStatCard icon={Wallet} label="Total Remitted" value={formatRwf(collected, { compact: true })} delta="platform payouts" tone="success" />
        <RichInsurerStatCard icon={CreditCard} label="Settlement Records" value={String(data.length)} delta="statements" tone="primary" />
        <RichInsurerStatCard icon={Clock} label="Pending Payouts" value={String(pending)} delta="awaiting transfer" tone={pending > 0 ? "warning" : "success"} />
        <RichInsurerStatCard icon={Building2} label="Payout Schedule" value="Bi-weekly" delta="automatic remittance" tone="primary" />
      </div>
      <SectionCard title="Settlements & Premium Remittances" description="History of payouts collected on InsureHub for your company.">
        {data.length === 0 ? (
          <EmptyState title="No settlements yet" body="Premium settlements to your company will appear here." />
        ) : (
          <PaginatedDataTable
            columns={["Settlement Ref", "Amount Remitted", "Collection Date", "Status"]}
            rows={data.map(
              (s): TableCell[] => [
                s.reference,
                formatRwf(s.amount),
                fmtDate(s.collectedAt),
                s.status === "paid" ? { pill: "Paid Out", tone: "success" } : { pill: "Processing", tone: "warning" },
              ],
            )}
          />
        )}
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Insurer Notifications                                               */
/* ------------------------------------------------------------------ */

export function InsurerNotifications() {
  const { data, error, refresh } = useRefreshableData<InsurerNotification[]>(getInsurerNotifications);
  if (error)
    return (
      <SectionCard title="Notifications">
        <p className="px-5 py-8 text-sm text-muted-foreground">No results found.</p>
      </SectionCard>
    );
  if (!data)
    return (
      <SectionCard title="Notifications">
        <p className="px-5 py-8 text-sm text-muted-foreground">Loading notifications…</p>
      </SectionCard>
    );

  const unread = data.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Notifications</h2>
        </div>
        {unread > 0 && (
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
              {unread} unread
            </span>
            <button
              type="button"
              onClick={() => runNotificationsAction("Marked all as read", markAllInsurerNotificationsRead, refresh)}
              className="rounded-full border border-input px-3 py-1.5 text-xs font-semibold hover:bg-accent"
            >
              Mark all as read
            </button>
          </div>
        )}
      </div>

      <SectionCard title="Inbox" description="Product approval, rejection and publishing updates for your company.">
        {data.length === 0 ? (
          <EmptyState title="Nothing yet" body="Product review updates for your company will show up here." />
        ) : (
          <ul className="divide-y divide-border">
            {data.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onRead={() => runNotificationsAction("Marked as read", () => markInsurerNotificationRead(n.id), refresh)}
              />
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

async function runNotificationsAction(label: string, fn: () => Promise<unknown>, refresh: () => void) {
  try {
    await fn();
    refresh();
  } catch {
    // ignore transient failures
  }
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: InsurerNotification;
  onRead: () => void;
}) {
  const unread = !notification.read;
  return (
    <li
      className={cn(
        "flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/40",
        unread && "bg-primary-soft/40",
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {unread && <span className="h-2 w-2 rounded-full bg-primary" />}
          <p className="text-sm font-semibold">{notification.title}</p>
          <span className="text-xs text-muted-foreground">{fmtDate(notification.createdAt)}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
      </div>
      {unread && (
        <button
          type="button"
          onClick={onRead}
          className="shrink-0 rounded-full border border-input px-3 py-1 text-xs font-semibold hover:bg-accent"
        >
          Mark read
        </button>
      )}
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Product Lifecycle modals                                            */
/* ------------------------------------------------------------------ */

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-card px-6 py-4">
          <div>
            <h3 className="text-base font-bold">{title}</h3>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

const customerTypeOptions = ["Individual", "Family", "SME", "Enterprise"];
const paymentOptions = ["Monthly", "Quarterly", "Annual", "Instalments"];
const badgeOptions = ["BestValue", "MostPopular", "FastestClaims"];

function ProductEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial?: InsurerProduct;
  onClose: () => void;
  onSaved: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const { data: cats } = useData<InsurerCategory[]>(getInsurerCategories);
  const [form, setForm] = useState<Record<string, unknown>>(() => ({
    name: initial?.name ?? "",
    categorySlug: initial?.categorySlug ?? "",
    monthly: initial?.monthly ?? "",
    coverAmount: initial?.coverAmount ?? "",
    excessAmount: initial?.excessAmount ?? "",
    claimDays: initial?.claimDays ?? "Same day",
    claimSpeed: initial?.claimSpeed ?? 1,
    customerTypes: initial?.customerTypes ?? [],
    payments: initial?.payments ?? [],
     badge: initial?.badge ?? "",
     purchaseMethod: initial?.purchaseMethod ?? "both",
     highlights: initial?.highlights ?? [],
     description: initial?.description ?? "",
     benefits: initial?.benefits ?? [],
     exclusions: initial?.exclusions ?? [],
     requiredDocuments: initial?.requiredDocuments ?? [],
     eligibility: initial?.eligibility ?? "",

    policyDuration: initial?.policyDuration ?? "1 year",
    deductible: initial?.deductible ?? "",
  }));
  const [saving, setSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const hasInfo = Object.values(form).some((v) => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== "" && v != null && v !== "Same day" && v !== "1 year";
  });

  const requestClose = () => {
    if (hasInfo) setConfirmClose(true);
    else onClose();
  };

  const discardAndClose = () => {
    setConfirmClose(false);
    onClose();
  };

  const saveDraftAndClose = async () => {
    setConfirmClose(false);
    await submit();
  };

  const toggleIn = (k: string, value: string) => {
    const arr = (form[k] as string[]) ?? [];
    set(k, arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]);
  };

  const commaInput = (k: string, value: string) => (
    <input
      type="text"
      value={value}
      onChange={(e) => set(k, e.target.value.split(",").map((x) => x.trim()).filter(Boolean))}
      placeholder="Comma-separated, e.g. No excess, Cashless claims"
      className={inputCls}
    />
  );

  const submit = async () => {
    setSaving(true);
    try {
      await onSaved({
        ...form,
        monthly: Number(form.monthly),
        coverAmount: Number(form.coverAmount),
        excessAmount: Number(form.excessAmount),
        claimSpeed: Number(form.claimSpeed),
        deductible: form.deductible === "" ? null : Number(form.deductible),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={initial ? "Edit Product" : "New Product"}
      subtitle={
        initial
          ? "Products already under review or published need admin involvement to change."
          : "Save your product to submit it for admin review to reach the marketplace."
      }
      onClose={requestClose}
    >
      <div className="space-y-5">
        <Field label="Product name">
          <input type="text" value={form.name as string} onChange={(e) => set("name", e.target.value)} className={inputCls} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <select
              value={form.categorySlug as string}
              onChange={(e) => set("categorySlug", e.target.value)}
              className={selectCls}
            >
              <option value="">Select a category</option>
              {(cats ?? []).map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Badge (optional)">
            <select
              value={form.badge as string}
              onChange={(e) => set("badge", e.target.value)}
              className={selectCls}
            >
              <option value="">None</option>
              {badgeOptions.map((b) => (
                <option key={b} value={b}>
                  {b.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/^./, (m) => m.toUpperCase())}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Purchase method">
            <select
              value={form.purchaseMethod as string}
              onChange={(e) => set("purchaseMethod", e.target.value)}
              className={selectCls}
            >
              <option value="both">Get Quote and Buy Now</option>
              <option value="quote">Get Quote only</option>
              <option value="buy_now">Buy Now only</option>
            </select>
          </Field>
          <Field label="Required documents">
            {commaInput("requiredDocuments", (form.requiredDocuments as string[]).join(", "))}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Monthly premium (RWF)">
            <input type="number" value={form.monthly as number} onChange={(e) => set("monthly", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Cover amount (RWF)">
            <input type="number" value={form.coverAmount as number} onChange={(e) => set("coverAmount", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Excess (RWF)">
            <input type="number" value={form.excessAmount as number} onChange={(e) => set("excessAmount", e.target.value)} className={inputCls} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Claim settlement time">
            <input type="text" value={form.claimDays as string} onChange={(e) => set("claimDays", e.target.value)} className={inputCls} placeholder="e.g. 3 business days" />
          </Field>
          <Field label="Claim speed score (1-5)">
            <input type="number" min={1} max={5} value={form.claimSpeed as number} onChange={(e) => set("claimSpeed", e.target.value)} className={inputCls} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Policy duration">
            <input type="text" value={form.policyDuration as string} onChange={(e) => set("policyDuration", e.target.value)} className={inputCls} placeholder="e.g. 1 year" />
          </Field>
          <Field label="Deductible (RWF, optional)">
            <input type="number" value={form.deductible as number} onChange={(e) => set("deductible", e.target.value)} className={inputCls} />
          </Field>
        </div>

        <Field label="Description">
          <textarea value={form.description as string} onChange={(e) => set("description", e.target.value)} className={inputCls} rows={3} />
        </Field>

        <Field label="Eligibility">
          <input type="text" value={form.eligibility as string} onChange={(e) => set("eligibility", e.target.value)} className={inputCls} placeholder="e.g. Residents 18+, valid KYC" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer types">
            <div className="space-y-1">
              {customerTypeOptions.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={(form.customerTypes as string[]).includes(t)} onChange={() => toggleIn("customerTypes", t)} className="h-4 w-4 accent-primary" />
                  {t}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Payment options">
            <div className="space-y-1">
              {paymentOptions.map((p) => (
                <label key={p} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={(form.payments as string[]).includes(p)} onChange={() => toggleIn("payments", p)} className="h-4 w-4 accent-primary" />
                  {p}
                </label>
              ))}
            </div>
          </Field>
        </div>

        <Field label="Highlights">
          {commaInput("highlights", (form.highlights as string[]).join(", "))}
        </Field>
        <Field label="Benefits">
          {commaInput("benefits", (form.benefits as string[]).join(", "))}
        </Field>
        <Field label="Exclusions">
          {commaInput("exclusions", (form.exclusions as string[]).join(", "))}
        </Field>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <button type="button" onClick={requestClose} className="rounded-full border border-input px-4 py-2 text-sm font-semibold hover:bg-accent">
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !form.name || !form.categorySlug}
            onClick={submit}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-brand hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {confirmClose && (
        <ModalShell title="Save changes?" subtitle="You have unsaved changes to this product." onClose={() => setConfirmClose(false)}>
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Would you like to save your changes, or discard them?
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setConfirmClose(false)} className="rounded-full border border-input px-4 py-2 text-sm font-semibold hover:bg-accent">
                Keep editing
              </button>
              <button type="button" onClick={discardAndClose} className="rounded-full border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10">
                Discard
              </button>
              <button
                type="button"
                disabled={saving || !form.name || !form.categorySlug}
                onClick={saveDraftAndClose}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-brand hover:bg-primary/90 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                Save
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </ModalShell>
  );
}

function ProductDetailModal({
  product,
  onClose,
  onAction,
}: {
  product: InsurerProduct;
  onClose: () => void;
  onAction: (label: string, fn: () => Promise<unknown>) => Promise<void>;
}) {
  const busy = (label: string) => () => {
    if (label === "Submit for review") return onAction("Submission submitted", () => submitInsurerProduct(product.id));
    if (label === "Publish") return onAction("Publish request sent", () => publishInsurerProduct(product.id));
    if (label === "Unpublish") return onAction("Unpublish request sent", () => unpublishInsurerProduct(product.id));
    if (label === "Delete") return onAction("Deletion completed", () => deleteInsurerProduct(product.id));
    return Promise.resolve();
  };

  const allowedActions: string[] = [];
  if (product.status === "draft" || product.status === "rejected") allowedActions.push("Submit for review");
  if (product.status === "approved") allowedActions.push("Publish");
  if (product.status === "published") allowedActions.push("Unpublish");
  if (product.status === "draft") allowedActions.push("Delete");

  return (
    <ModalShell
      title={product.name}
      subtitle={`${product.category} · ${formatRwf(product.monthly, { compact: true })}/mo · ${product.policies} policies`}
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <ProductStatusBadge status={product.status} />
          {product.rejectionReason && (
            <span className="text-xs font-medium text-destructive">Rejected: {product.rejectionReason}</span>
          )}
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          <Detail label="Cover amount">{formatRwf(product.coverAmount)}</Detail>
          <Detail label="Excess">{formatRwf(product.excessAmount)}</Detail>
          <Detail label="Claim time">{product.claimDays}</Detail>
          <Detail label="Policy duration">{product.policyDuration ?? "—"}</Detail>
          <Detail label="Deductible">{product.deductible != null ? formatRwf(product.deductible) : "—"}</Detail>
          <Detail label="Eligibility">{product.eligibility ?? "—"}</Detail>
        </dl>

        {product.description && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Description</h4>
            <p className="mt-1 text-sm text-muted-foreground">{product.description}</p>
          </div>
        )}

        {product.highlights.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Highlights</h4>
            <ul className="mt-2 flex flex-wrap gap-2">
              {product.highlights.map((h) => (
                <li key={h} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{h}</li>
              ))}
            </ul>
          </div>
        )}

        {product.benefits.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Benefits</h4>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {product.benefits.map((b) => <li key={b}>{b}</li>)}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          {allowedActions.map((a) => (
            <button
              key={a}
              type="button"
              onClick={busy(a)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold",
                a === "Delete"
                  ? "border border-destructive text-destructive hover:bg-destructive/10"
                  : "bg-primary text-primary-foreground shadow-brand hover:bg-primary/90",
              )}
            >
              {a}
            </button>
          ))}
          <button type="button" onClick={onClose} className="rounded-full border border-input px-4 py-2 text-sm font-semibold hover:bg-accent">
            Close
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-muted px-4 py-3">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold">{children}</dd>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring";
const selectCls =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring";

/* ------------------------------------------------------------------ */
/* Insurer Quote Requests Management Component                        */
/* ------------------------------------------------------------------ */

import {
  getInsurerQuoteRequests,
  getMarketplaceProductQuestions,
  insurerQuoteRequest,
  insurerRejectQuoteRequest,
  insurerRequestQuoteInfo,
  insurerRequestQuoteInspection,
  type QuoteRequestItem,
} from "@/lib/api";

export function InsurerQuoteRequests() {
  const { data, error, refresh } = useRefreshableData<QuoteRequestItem[]>(getInsurerQuoteRequests);

  const [activeModal, setActiveModal] = useState<{
    type: "quote" | "reject" | "info" | "inspection";
    item: QuoteRequestItem;
  } | null>(null);

  const [inputPremium, setInputPremium] = useState("");
  const [inputNote, setInputNote] = useState("");
  const [inputText, setInputText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [answerLabels, setAnswerLabels] = useState<Record<string, string>>({});

  const requests = data ?? [];

  const openModal = (type: "quote" | "reject" | "info" | "inspection", item: QuoteRequestItem) => {
    setInputPremium(item.quotedPremium ? String(item.quotedPremium) : "");
    setInputNote("");
    setInputText("");
    setActiveModal({ type, item });
    // Resolve human-readable labels for the customer's stored answers.
    getMarketplaceProductQuestions(item.planId)
      .then((resp) =>
        setAnswerLabels(
          Object.fromEntries(resp.questions.map((q) => [q.key, q.label])),
        ),
      )
      .catch(() => setAnswerLabels({}));
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal) return;
    setSubmitting(true);
    try {
      if (activeModal.type === "quote") {
        const prem = Number(inputPremium.replace(/[^0-9]/g, ""));
        if (!prem || prem <= 0) throw new Error("Please enter a valid premium amount.");
        await insurerQuoteRequest(activeModal.item.id, prem, inputNote.trim() || undefined);
      } else if (activeModal.type === "reject") {
        if (!inputText.trim()) throw new Error("Please enter a rejection reason.");
        await insurerRejectQuoteRequest(activeModal.item.id, inputText.trim());
      } else if (activeModal.type === "info") {
        if (!inputText.trim()) throw new Error("Please enter your question/request.");
        await insurerRequestQuoteInfo(activeModal.item.id, inputText.trim());
      } else if (activeModal.type === "inspection") {
        if (!inputText.trim()) throw new Error("Please enter inspection details.");
        await insurerRequestQuoteInspection(activeModal.item.id, inputText.trim());
      }
      setActiveModal(null);
      setInputPremium("");
      setInputNote("");
      setInputText("");
      refresh();
    } catch (err: any) {
      alert(err?.message || "Action failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="Quote Requests Management"
        description="Review customer applications, offer custom premiums, request info, or schedule physical inspections."
      >
        {error ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">Failed to load quote requests.</p>
        ) : !data ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">Loading quote requests…</p>
        ) : requests.length === 0 ? (
          <EmptyState
            title="No quote requests yet"
            body="Applications submitted by customers on the marketplace will appear here for review."
          />
        ) : (
          <PaginatedDataTable
            columns={[
              "Customer Name",
              "Product Name",
              "Submitted Date",
              "Status",
              "Quoted Premium",
              "Actions",
            ]}
            rows={requests.map(
              (r): TableCell[] => [
                `${r.customerName} (${r.customerEmail})`,
                r.productName,
                fmtDate(r.submittedAt),
                {
                  pill: r.status.replace(/_/g, " "),
                  tone:
                    r.status === "quoted" || r.status === "accepted"
                      ? "success"
                      : r.status === "rejected"
                      ? "danger"
                      : r.status === "info_requested"
                      ? "info"
                      : "warning",
                },
                r.quotedPremium ? formatRwf(r.quotedPremium) : "Pending",
                "Action",
              ],
            )}
            rowActions={["Quote Premium", "Request Info", "Request Inspection", "Reject"]}
            onRowAction={(i, action) => {
              const item = requests[i];
              if (action === "Quote Premium") openModal("quote", item);
              if (action === "Reject") openModal("reject", item);
              if (action === "Request Info") openModal("info", item);
              if (action === "Request Inspection") openModal("inspection", item);
            }}
          />
        )}
      </SectionCard>

      {/* Modal for Insurer Action */}
      {activeModal && (
        <ModalShell
          title={
            activeModal.type === "quote"
              ? `Provide Premium Quote for ${activeModal.item.customerName}`
              : activeModal.type === "reject"
              ? `Decline Quote Request`
              : activeModal.type === "info"
              ? `Request Additional Info`
              : `Request Physical Inspection`
          }
          subtitle={`Product: ${activeModal.item.productName} · Submitted: ${fmtDate(activeModal.item.submittedAt)}`}
          onClose={() => setActiveModal(null)}
        >
          <form onSubmit={handleActionSubmit} className="space-y-4">
            {/* Customer Application Details */}
            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Application Details
              </p>
              <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Customer: </span>
                  <span className="font-semibold text-foreground">{activeModal.item.customerName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Submitted: </span>
                  <span className="font-semibold text-foreground">{fmtDate(activeModal.item.submittedAt)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email: </span>
                  <span className="font-semibold text-foreground break-all">{activeModal.item.customerEmail}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone: </span>
                  <span className="font-semibold text-foreground">{activeModal.item.customerPhone || "—"}</span>
                </div>
              </div>
            </div>

            {/* Display Customer Questionnaire Answers */}
            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Questionnaire Answers
              </p>
              {Object.entries(activeModal.item.answers || {}).length === 0 ? (
                <p className="text-xs text-muted-foreground">No answers were submitted.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 text-xs">
                  {Object.entries(activeModal.item.answers || {}).map(([key, val]) => (
                    <div key={key}>
                      <span className="text-muted-foreground">{answerLabels[key] || key}: </span>
                      <span className="font-semibold text-foreground break-all">{val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {activeModal.type === "quote" && (
              <>
                <Field label="Quoted Premium (Monthly RWF)">
                  <input
                    type="number"
                    required
                    value={inputPremium}
                    placeholder="e.g. 45000"
                    onChange={(e) => setInputPremium(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Notes / Terms for Customer (Optional)">
                  <textarea
                    rows={3}
                    value={inputNote}
                    placeholder="e.g. Includes 10% loyalty discount..."
                    onChange={(e) => setInputNote(e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </>
            )}

            {activeModal.type === "reject" && (
              <Field label="Rejection Reason">
                <textarea
                  rows={3}
                  required
                  value={inputText}
                  placeholder="Explain why this request cannot be covered..."
                  onChange={(e) => setInputText(e.target.value)}
                  className={inputCls}
                />
              </Field>
            )}

            {activeModal.type === "info" && (
              <Field label="Question / Information Required">
                <textarea
                  rows={3}
                  required
                  value={inputText}
                  placeholder="e.g. Please upload proof of vehicle inspection or confirm driver license age..."
                  onChange={(e) => setInputText(e.target.value)}
                  className={inputCls}
                />
              </Field>
            )}

            {activeModal.type === "inspection" && (
              <Field label="Inspection Details & Instructions">
                <textarea
                  rows={3}
                  required
                  value={inputText}
                  placeholder="e.g. Bring vehicle to Remera Assessment Center on Tuesday..."
                  onChange={(e) => setInputText(e.target.value)}
                  className={inputCls}
                />
              </Field>
            )}

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-full border border-input px-4 py-2 text-sm font-semibold hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-brand hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Confirm & Send to Customer"}
              </button>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  );
}

