"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Package,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

import { EmptyState, SectionCard, StatusPill, type TableCell } from "@/components/dashboard/ui-bits";
import { PaginatedDataTable } from "@/components/dashboard/paginated-data-table";
import {
  approveAdminProduct,
  getAdminProduct,
  getAdminProducts,
  publishAdminProduct,
  rejectAdminProduct,
  type AdminProduct,
  type AdminProductDetail,
} from "@/lib/api";
import { formatRwf } from "@/lib/insurance-data";
import { cn } from "@/lib/utils";

const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

const statusTone: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  draft: "neutral",
  pending_review: "warning",
  approved: "info",
  published: "success",
  rejected: "danger",
};

const statusLabel: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  approved: "Approved",
  published: "Published",
  rejected: "Rejected",
};

const STATUS_TABS = ["all", "pending_review", "approved", "published", "rejected"] as const;

export default function AdminProductReview() {
  const [status, setStatus] = useState<string>("all");
  const [providerId, setProviderId] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<AdminProduct[] | null>(null);
  const [allOptions, setAllOptions] = useState<AdminProduct[]>([]);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<AdminProduct | null>(null);
  const [detail, setDetail] = useState<AdminProductDetail | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // The admin review workbench filters server-side. We also load the unfiltered
  // product register once to build the company/category/status dropdown options.
  useEffect(() => {
    getAdminProducts()
      .then(setAllOptions)
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    setData(null);
    setError(false);
    getAdminProducts({
      status: status === "all" ? undefined : status,
      providerId: providerId || undefined,
      categorySlug: categorySlug || undefined,
      search: search || undefined,
    })
      .then(setData)
      .catch(() => setError(true));
  }, [status, providerId, categorySlug, search]);

  useEffect(() => {
    load();
  }, [load]);

  const providers = Array.from(
    new Map(allOptions.map((p) => [p.providerId, { id: p.providerId, name: p.provider }])).values(),
  );
  const categories = Array.from(
    new Map(allOptions.map((p) => [p.categorySlug, { slug: p.categorySlug, name: p.category }])).values(),
  );
  const statuses = Array.from(new Set(allOptions.map((p) => p.status)));

  // Status tabs always show the core lifecycle tabs plus any statuses present.
  const tabs = ["all", ...Array.from(new Set([...statuses, ...STATUS_TABS])).filter((s) => s !== "all")];

  const openDetail = async (p: AdminProduct) => {
    setSelected(p);
    setDetail(null);
    try {
      setDetail(await getAdminProduct(p.id));
    } catch {
      setDetail(null);
    }
  };

  const runAction = async (label: string, fn: () => Promise<unknown>) => {
    setToast(null);
    try {
      await fn();
      setToast(`${label} completed`);
      setSelected(null);
      setDetail(null);
      load();
    } catch {
      setToast(`${label} failed — please try again`);
    }
  };

  const pending = (data ?? []).filter((p) => p.status === "pending_review").length;
  const approved = (data ?? []).filter((p) => p.status === "approved").length;

  if (error)
    return (
      <SectionCard title="Product Review">
        <p className="px-5 py-8 text-sm text-muted-foreground">
          No results found.
        </p>
      </SectionCard>
    );

  return (
    <div className="space-y-6">
      {toast && (
        <div className="flex items-center justify-between rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> {toast}
          </span>
          <button type="button" onClick={() => setToast(null)} className="text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {!data ? (
        <SectionCard title="Product Review">
          <p className="px-5 py-8 text-sm text-muted-foreground">Loading products for review…</p>
        </SectionCard>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStat icon={Package} label="Matching Products" value={String(data.length)} delta="current filter" tone="primary" />
            <AdminStat icon={Clock} label="Awaiting Review" value={String(pending)} delta="need a decision" tone={pending > 0 ? "warning" : "success"} />
            <AdminStat icon={ShieldCheck} label="Approved (unpublished)" value={String(approved)} delta="ready to publish" tone="info" />
            <AdminStat icon={CheckCircle2} label="Published" value={String(data.filter((p) => p.status === "published").length)} delta="live on marketplace" tone="success" />
          </div>

          <SectionCard
            title="Product Review Workbench"
            description="Review insurer submissions — approve, reject (with reason) or publish approved lines."
          >
            <div className="space-y-4 border-b border-border p-5">
              <div className="flex flex-wrap items-center gap-2">
                {tabs.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setStatus(t)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                      status === t
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {t === "all" ? "All" : statusLabel[t] ?? t.replace(/_/g, " ")}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
                <label className="flex items-center gap-2 rounded-xl bg-muted px-3">
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search product or company name"
                    className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </label>
                <select value={providerId} onChange={(e) => setProviderId(e.target.value)} className="h-10 rounded-xl border border-border bg-card px-3 text-sm text-muted-foreground outline-none">
                  <option value="">All companies</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <select value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} className="h-10 rounded-xl border border-border bg-card px-3 text-sm text-muted-foreground outline-none">
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {data.length === 0 ? (
              <EmptyState title="No products match" body="Adjust the filter or search to find products to review." />
            ) : (
              <PaginatedDataTable
                columns={["Product", "Company", "Category", "Monthly", "Status", "Submitted"]}
                rows={data.map(
                  (p): TableCell[] => [
                    p.name,
                    p.provider,
                    p.category,
                    formatRwf(p.monthly, { compact: true }),
                    { pill: statusLabel[p.status] ?? p.status, tone: statusTone[p.status] ?? "neutral" },
                    fmtDate(p.submittedAt),
                  ],
                )}
                rowActions={["Review"]}
                onRowAction={(i) => openDetail(data[i])}
              />
            )}
          </SectionCard>
        </>
      )}

      {selected && (
        <ReviewModal
          product={selected}
          detail={detail}
          onClose={() => {
            setSelected(null);
            setDetail(null);
          }}
          onApprove={() => runAction("Approval", () => approveAdminProduct(selected.id))}
          onReject={(reason) => runAction("Rejection", () => rejectAdminProduct(selected.id, reason))}
          onPublish={() => runAction("Publish", () => publishAdminProduct(selected.id))}
        />
      )}
    </div>
  );
}

function AdminStat({
  icon: Icon,
  label,
  value,
  delta,
  tone = "primary",
}: {
  icon: typeof Package;
  label: string;
  value: string | number;
  delta?: string;
  tone?: "primary" | "success" | "warning" | "danger" | "info";
}) {
  const tones = {
    primary: { icon: "bg-primary/10 text-primary", value: "text-foreground" },
    success: { icon: "bg-success/10 text-success", value: "text-success" },
    warning: { icon: "bg-warning/12 text-warning-foreground", value: "text-warning-foreground" },
    danger: { icon: "bg-destructive/10 text-destructive", value: "text-destructive" },
    info: { icon: "bg-primary/10 text-primary", value: "text-primary" },
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

function ReviewModal({
  product,
  detail,
  onClose,
  onApprove,
  onReject,
  onPublish,
}: {
  product: AdminProduct;
  detail: AdminProductDetail | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onPublish: () => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-card px-6 py-4">
          <div>
            <h3 className="text-base font-bold">{product.name}</h3>
            <p className="text-sm text-muted-foreground">
              {product.provider} · {product.category} · {formatRwf(product.monthly, { compact: true })}/mo
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label={statusLabel[product.status] ?? product.status} tone={statusTone[product.status] ?? "neutral"} />
            {product.rejectionReason && (
              <span className="text-xs font-medium text-destructive">Rejected: {product.rejectionReason}</span>
            )}
          </div>

          {!detail ? (
            <p className="text-sm text-muted-foreground">Loading product details…</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{detail.description || "No description provided."}</p>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Cover amount">{formatRwf(detail.coverAmount)}</Field>
                <Field label="Excess">{formatRwf(detail.excessAmount)}</Field>
                <Field label="Claim time">{detail.claimDays}</Field>
                <Field label="Policy duration">{detail.policyDuration ?? "—"}</Field>
                <Field label="Deductible">{detail.deductible != null ? formatRwf(detail.deductible) : "—"}</Field>
                <Field label="Eligibility">{detail.eligibility ?? "—"}</Field>
              </div>

              {detail.highlights.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Highlights</h4>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {detail.highlights.map((h) => (
                      <li key={h} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detail.benefits.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Benefits</h4>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {detail.benefits.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {detail.exclusions.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-warning-foreground">Exclusions</h4>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {detail.exclusions.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          <div className="space-y-3 border-t border-border pt-4">
            {product.status === "pending_review" && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  Rejection reason <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="Required if rejecting. Explains to the insurer why the product was declined."
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            )}

            {product.status === "rejected" && (
              <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                This product was rejected. The insurer can edit and resubmit it for review.
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              {product.status === "pending_review" && (
                <>
                  <button
                    type="button"
                    disabled={!reason.trim()}
                    onClick={() => onReject(reason.trim())}
                    className="rounded-full border border-destructive px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-40"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={onApprove}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-brand hover:bg-primary/90"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </button>
                </>
              )}
              {product.status === "approved" && (
                <button
                  type="button"
                  onClick={onPublish}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-brand hover:bg-primary/90"
                >
                  <CheckCircle2 className="h-4 w-4" /> Publish to marketplace
                </button>
              )}
              <button type="button" onClick={onClose} className="rounded-full border border-input px-4 py-2 text-sm font-semibold hover:bg-accent">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-muted px-4 py-3">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold">{children}</dd>
    </div>
  );
}
