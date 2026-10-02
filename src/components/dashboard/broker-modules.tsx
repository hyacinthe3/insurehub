"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Briefcase,
  ClipboardList,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  ScrollText,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";

import { PaginatedDataTable } from "@/components/dashboard/paginated-data-table";
import {
  EmptyState,
  SectionCard,
  StatusPill,
  type StatusTone,
} from "@/components/dashboard/ui-bits";
import { cn } from "@/lib/utils";
import { formatRwf } from "@/lib/insurance-data";
import {
  addBrokerCustomer,
  ApiError,
  createBrokerQuote,
  getBrokerClaims,
  getBrokerCommissions,
  getBrokerCustomers,
  getBrokerOverview,
  getBrokerPolicies,
  getBrokerProducts,
  getBrokerQuotes,
  getBrokerRenewals,
  getBrokerReports,
  getBrokerSettings,
  getMarketplaceProductQuestions,
  updateBrokerSettings,
  type BrokerClaim,
  type BrokerCommission,
  type BrokerCustomer,
  type BrokerOverview as BrokerOverviewData,
  type BrokerPolicy,
  type BrokerProductOption,
  type BrokerQuote,
  type BrokerRenewal,
  type BrokerReports,
  type BrokerSettings,
  type QuoteQuestion,
} from "@/lib/api";

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const fmtMonth = (value: string) =>
  new Date(`${value}-01T00:00:00`).toLocaleDateString("en-GB", { month: "short", year: "numeric" });

function messageOf(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}

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
    loader()
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [loader, tick]);
  const refresh = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, refresh };
}

function ErrorPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="surface p-8 text-center">
      <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="mt-2 text-sm font-semibold text-foreground">We couldn&apos;t load this data.</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Make sure the backend is running, then try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-brand hover:bg-primary/90"
      >
        <RefreshCw className="h-4 w-4" /> Retry
      </button>
    </div>
  );
}

function Loading({ label }: { label: string }) {
  return (
    <div className="surface flex items-center justify-center gap-2 px-5 py-12 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

function BrokerStatCard({
  icon: Icon,
  label,
  value,
  delta,
  tone = "primary",
}: {
  icon: typeof Users;
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

const inputCls =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring";
const selectCls =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
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

const quoteTone = (status: string): StatusTone => {
  switch (status) {
    case "quoted":
      return "info";
    case "accepted":
      return "success";
    case "rejected":
      return "danger";
    case "info_requested":
    case "inspection_required":
      return "warning";
    default:
      return "neutral";
  }
};

const policyTone = (status: string): StatusTone => {
  if (status === "active") return "success";
  if (status === "expiring") return "warning";
  if (status === "expired") return "danger";
  return "neutral";
};

const claimTone = (status: string): StatusTone => {
  switch (status) {
    case "paid":
    case "approved":
      return "success";
    case "under_review":
      return "warning";
    case "rejected":
      return "danger";
    default:
      return "info";
  }
};

const customerTone = (status: string): StatusTone => {
  if (status === "active") return "success";
  if (status === "pending") return "warning";
  if (status === "declined") return "danger";
  return "neutral";
};

const humanize = (value: string) => value.replace(/_/g, " ").replace(/(^|\s)\w/g, (m) => m.toUpperCase());

/* ------------------------------------------------------------------ */
/* Overview                                                            */
/* ------------------------------------------------------------------ */

export function BrokerOverview() {
  const { data, error, refresh } = useRefreshableData<BrokerOverviewData>(getBrokerOverview);

  if (error) return <ErrorPanel onRetry={refresh} />;
  if (!data) return <Loading label="Loading your book…" />;

  const t = data.totals;

  return (
    <div className="space-y-6">
      <div className="surface border-primary/20 bg-gradient-to-r from-card via-card to-primary-soft/30 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-brand">
              {(data.broker.company ?? data.broker.name).charAt(0).toUpperCase()}
            </span>
            <div>
              <h2 className="text-xl font-bold">{data.broker.company ?? data.broker.name}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {data.broker.name} · {data.broker.email} · member since {fmtDate(data.broker.memberSince)}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-semibold text-success">
            <ShieldCheck className="h-3.5 w-3.5" /> Licensed broker
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <BrokerStatCard icon={Users} label="Clients" value={t.clients.toLocaleString()} delta="In your book" />
        <BrokerStatCard
          icon={ScrollText}
          label="Policies in force"
          value={t.activePolicies.toLocaleString()}
          delta={`${t.renewalsDue} renewals due (90 days)`}
          tone="success"
        />
        <BrokerStatCard
          icon={TrendingUp}
          label="Placed premium"
          value={formatRwf(t.placedPremium, { compact: true })}
          delta={`${t.openQuotes} open quotes`}
        />
        <BrokerStatCard
          icon={Wallet}
          label="Commissions"
          value={formatRwf(t.pendingCommission, { compact: true })}
          delta={`${formatRwf(t.paidCommission, { compact: true })} paid`}
          tone="warning"
        />
      </div>

      <SectionCard title="Renewals due" description="Broker-linked policies renewing in the next 90 days.">
        {data.renewals.length === 0 ? (
          <EmptyState title="No renewals due" body="Policies you place will be tracked here as they approach renewal." />
        ) : (
          <PaginatedDataTable
            columns={["Client", "Policy", "Product", "Renewal date", "Premium", "Status"]}
            defaultPageSize={5}
            rows={data.renewals.map((r) => [
              r.customerName,
              r.policyNumber,
              r.planName,
              fmtDate(r.renewalDate),
              formatRwf(r.premium, { compact: true }),
              { pill: humanize(r.status), tone: policyTone(r.status) },
            ])}
          />
        )}
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Recent quotes" description="Latest requests raised for your clients.">
          {data.recentQuotes.length === 0 ? (
            <EmptyState title="No quotes yet" body="Quotes requested for your clients will appear here." />
          ) : (
            <ul className="divide-y divide-border">
              {data.recentQuotes.map((q) => (
                <li key={q.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{q.customerName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {q.productName} · {q.providerName}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusPill label={humanize(q.status)} tone={quoteTone(q.status)} />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {q.quotedPremium ? formatRwf(q.quotedPremium, { compact: true }) : "Awaiting quote"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Recent commissions" description="Earned on settled placements.">
          {data.recentCommissions.length === 0 ? (
            <EmptyState title="No commissions yet" body="Commission is recorded automatically when your client's policy is issued." />
          ) : (
            <ul className="divide-y divide-border">
              {data.recentCommissions.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{c.customerName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.policyNumber} · {c.planName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatRwf(c.amount, { compact: true })}</p>
                    <StatusPill label={humanize(c.status)} tone={c.status === "paid" ? "success" : "warning"} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Customers                                                           */
/* ------------------------------------------------------------------ */

export function BrokerCustomers() {
  const { data, error, refresh } = useRefreshableData<BrokerCustomer[]>(getBrokerCustomers);
  const [adding, setAdding] = useState(false);
  const [active, setActive] = useState<BrokerCustomer | null>(null);

  if (error) return <ErrorPanel onRetry={refresh} />;
  if (!data) return <Loading label="Loading clients…" />;

  return (
    <div className="space-y-6">
      <SectionCard
        title="My customers"
        description="The book of clients you represent on InsureHub."
        action={
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-brand hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Add customer
          </button>
        }
      >
        {data.length === 0 ? (
          <EmptyState
            title="No clients yet"
            body="Add a client to start requesting quotes and tracking their policies."
            action={{ label: "Add customer" }}
          />
        ) : (
          <PaginatedDataTable
            columns={["Client", "Type", "Policies", "Premium", "Status", "Since"]}
            rows={data.map((c) => [
              c.name,
              c.type,
              String(c.policyCount),
              formatRwf(c.premiumTotal, { compact: true }),
              { pill: humanize(c.status), tone: customerTone(c.status) },
              fmtDate(c.since),
            ])}
            rowActions={["View"]}
            onRowAction={(i, action) => {
              if (action === "View") setActive(data[i]);
            }}
          />
        )}
      </SectionCard>

      {adding && (
        <AddCustomerModal
          onClose={() => setAdding(false)}
          onCreated={() => {
            setAdding(false);
            refresh();
          }}
        />
      )}

      {active && (
        <ModalShell title={active.name} subtitle="Client record" onClose={() => setActive(null)}>
          <dl className="grid gap-3 sm:grid-cols-2">
            <Detail label="Email">{active.email}</Detail>
            <Detail label="Phone">{active.phone ?? "—"}</Detail>
            <Detail label="Type">{active.type}</Detail>
            <Detail label="Status">{humanize(active.status)}</Detail>
            <Detail label="InsureHub account">{active.linked ? "Linked" : "Not linked"}</Detail>
            <Detail label="Consent recorded">{active.consentAt ? fmtDate(active.consentAt) : "—"}</Detail>
            <Detail label="Policies">{active.policyCount}</Detail>
            <Detail label="Premium placed">{formatRwf(active.premiumTotal)}</Detail>
          </dl>
        </ModalShell>
      )}
    </div>
  );
}

function AddCustomerModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState("Business");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!name.trim() || !email.trim()) {
      setErr("Client name and email are required.");
      return;
    }
    setSaving(true);
    try {
      await addBrokerCustomer({ name, email, phone, type });
      onCreated();
    } catch (error) {
      setErr(messageOf(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Add customer" subtitle="Create a client record in your book." onClose={onClose}>
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Client name">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kigali Logistics Ltd" />
        </Field>
        <Field label="Email">
          <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@example.com" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone">
            <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250 …" />
          </Field>
          <Field label="Type">
            <select className={selectCls} value={type} onChange={(e) => setType(e.target.value)}>
              <option>Individual</option>
              <option>Business</option>
            </select>
          </Field>
        </div>
        {err && <p className="text-sm font-medium text-destructive">{err}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-full border border-input px-4 py-2 text-sm font-semibold hover:bg-accent">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-brand hover:bg-primary/90 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save client
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* Quotes                                                              */
/* ------------------------------------------------------------------ */

export function BrokerQuotes() {
  const { data, error, refresh } = useRefreshableData<BrokerQuote[]>(getBrokerQuotes);
  const [creating, setCreating] = useState(false);
  const [active, setActive] = useState<BrokerQuote | null>(null);

  if (error) return <ErrorPanel onRetry={refresh} />;
  if (!data) return <Loading label="Loading quotes…" />;

  return (
    <div className="space-y-6">
      <SectionCard
        title="Client quotes"
        description="Requests you have submitted to insurers on behalf of your clients."
        action={
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-brand hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> New quote
          </button>
        }
      >
        {data.length === 0 ? (
          <EmptyState
            title="No quotes yet"
            body="Request a quote for one of your clients to start the placement."
            action={{ label: "New quote" }}
          />
        ) : (
          <PaginatedDataTable
            columns={["Client", "Product", "Provider", "Premium", "Status", "Submitted"]}
            rows={data.map((q) => [
              q.customerName,
              q.productName,
              q.providerName,
              q.quotedPremium ? formatRwf(q.quotedPremium, { compact: true }) : "—",
              { pill: humanize(q.status), tone: quoteTone(q.status) },
              fmtDate(q.submittedAt),
            ])}
            rowActions={["View"]}
            onRowAction={(i, action) => {
              if (action === "View") setActive(data[i]);
            }}
          />
        )}
      </SectionCard>

      {creating && (
        <NewQuoteModal
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            refresh();
          }}
        />
      )}

      {active && <QuoteDetail quote={active} onClose={() => setActive(null)} />}
    </div>
  );
}

function QuoteDetail({ quote, onClose }: { quote: BrokerQuote; onClose: () => void }) {
  const [labels, setLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    getMarketplaceProductQuestions(quote.planId)
      .then((resp) => {
        if (!cancelled) setLabels(Object.fromEntries(resp.questions.map((q) => [q.key, q.label])));
      })
      .catch(() => {
        if (!cancelled) setLabels({});
      });
    return () => {
      cancelled = true;
    };
  }, [quote.planId]);

  const entries = Object.entries(quote.answers ?? {});

  return (
    <ModalShell title={quote.productName} subtitle={`${quote.customerName} · ${quote.providerName}`} onClose={onClose}>
      <dl className="grid gap-3 sm:grid-cols-2">
        <Detail label="Client email">{quote.customerEmail}</Detail>
        <Detail label="Client phone">{quote.customerPhone}</Detail>
        <Detail label="Status">{humanize(quote.status)}</Detail>
        <Detail label="Quoted premium">
          {quote.quotedPremium ? formatRwf(quote.quotedPremium) : "Awaiting insurer quote"}
        </Detail>
        <Detail label="Submitted">{fmtDate(quote.submittedAt)}</Detail>
        <Detail label="Offer expires">{quote.expiresAt ? fmtDate(quote.expiresAt) : "—"}</Detail>
      </dl>
      <div className="mt-5">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Questionnaire answers
        </h4>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No answers were recorded for this request.</p>
        ) : (
          <dl className="grid gap-3 sm:grid-cols-2">
            {entries.map(([key, value]) => (
              <Detail key={key} label={labels[key] ?? key}>
                {value || "—"}
              </Detail>
            ))}
          </dl>
        )}
      </div>
    </ModalShell>
  );
}

function NewQuoteModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { data: products } = useData<BrokerProductOption[]>(getBrokerProducts);
  const [planId, setPlanId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<QuoteQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) return;
    let cancelled = false;
    getMarketplaceProductQuestions(planId)
      .then((resp) => {
        if (!cancelled) setQuestions(resp.questions);
      })
      .catch(() => {
        if (!cancelled) setQuestions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [planId]);

  const chooseProduct = (value: string) => {
    setPlanId(value);
    setAnswers({});
    setQuestions([]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!planId) return setErr("Please choose a product.");
    if (!name.trim() || !email.trim() || !phone.trim()) {
      return setErr("Client name, email and phone are required.");
    }
    const missing = questions.find((q) => q.required && !String(answers[q.key] ?? "").trim());
    if (missing) return setErr(`Please answer: ${missing.label}`);
    setSaving(true);
    try {
      await createBrokerQuote({
        planId,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        answers,
      });
      onCreated();
    } catch (error) {
      setErr(messageOf(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="New quote" subtitle="Raise an application with the insurer for your client." onClose={onClose}>
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Product">
          <select className={selectCls} value={planId} onChange={(e) => chooseProduct(e.target.value)}>
            <option value="">Select a product…</option>
            {(products ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.providerName} ({formatRwf(p.monthly, { compact: true })}/mo)
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Client name">
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Client name" />
          </Field>
          <Field label="Client phone">
            <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250 …" />
          </Field>
        </div>
        <Field label="Client email">
          <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@example.com" />
        </Field>

        {questions.length > 0 && (
          <div className="space-y-4 rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Underwriting questions
            </p>
            {questions.map((q) => (
              <Field key={q.key} label={`${q.label}${q.required ? " *" : ""}`}>
                {q.type === "select" ? (
                  <select
                    className={selectCls}
                    value={answers[q.key] ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
                  >
                    <option value="">Select…</option>
                    {(q.options ?? []).map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className={inputCls}
                    type={q.type === "number" ? "number" : q.type === "date" ? "date" : "text"}
                    value={answers[q.key] ?? ""}
                    placeholder={q.placeholder ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
                  />
                )}
              </Field>
            ))}
          </div>
        )}

        {err && <p className="text-sm font-medium text-destructive">{err}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-full border border-input px-4 py-2 text-sm font-semibold hover:bg-accent">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-brand hover:bg-primary/90 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Submit to insurer
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* Policies & renewals                                                 */
/* ------------------------------------------------------------------ */

function PolicyViewModal({ policy, onClose }: { policy: BrokerPolicy; onClose: () => void }) {
  return (
    <ModalShell title={policy.policyNumber} subtitle={`${policy.customerName} · ${policy.provider}`} onClose={onClose}>
      <dl className="grid gap-3 sm:grid-cols-2">
        <Detail label="Product">{policy.planName}</Detail>
        <Detail label="Category">{policy.category}</Detail>
        <Detail label="Client email">{policy.customerEmail}</Detail>
        <Detail label="Premium">{formatRwf(policy.premium)}</Detail>
        <Detail label="Start date">{fmtDate(policy.startDate)}</Detail>
        <Detail label="End date">{fmtDate(policy.endDate)}</Detail>
        <Detail label="Status">{humanize(policy.status)}</Detail>
        <Detail label="Renewal in">{policy.daysToRenewal} days</Detail>
      </dl>
    </ModalShell>
  );
}

export function BrokerPolicies() {
  const { data, error, refresh } = useRefreshableData<BrokerPolicy[]>(getBrokerPolicies);
  const [active, setActive] = useState<BrokerPolicy | null>(null);

  if (error) return <ErrorPanel onRetry={refresh} />;
  if (!data) return <Loading label="Loading policies…" />;

  return (
    <div className="space-y-6">
      <SectionCard title="Client policies" description="Policies you have placed, with their renewal status.">
        {data.length === 0 ? (
          <EmptyState title="No policies yet" body="Once a client accepts a quote and pays, the policy appears here." />
        ) : (
          <PaginatedDataTable
            columns={["Policy", "Client", "Product", "Provider", "Premium", "Ends", "Status"]}
            rows={data.map((p) => [
              p.policyNumber,
              p.customerName,
              p.planName,
              p.provider,
              formatRwf(p.premium, { compact: true }),
              fmtDate(p.endDate),
              { pill: humanize(p.status), tone: policyTone(p.status) },
            ])}
            rowActions={["View"]}
            onRowAction={(i, action) => {
              if (action === "View") setActive(data[i]);
            }}
          />
        )}
      </SectionCard>
      {active && <PolicyViewModal policy={active} onClose={() => setActive(null)} />}
    </div>
  );
}

export function BrokerRenewals() {
  const { data, error, refresh } = useRefreshableData<BrokerRenewal[]>(getBrokerRenewals);
  const [active, setActive] = useState<BrokerRenewal | null>(null);

  if (error) return <ErrorPanel onRetry={refresh} />;
  if (!data) return <Loading label="Loading renewals…" />;

  return (
    <div className="space-y-6">
      <SectionCard title="Renewals due" description="Client policies renewing within the next 90 days.">
        {data.length === 0 ? (
          <EmptyState title="No renewals due" body="You have no client policies approaching renewal right now." />
        ) : (
          <PaginatedDataTable
            columns={["Client", "Policy", "Product", "Renewal date", "Days", "Premium", "Status"]}
            rows={data.map((r) => [
              r.customerName,
              r.policyNumber,
              r.planName,
              fmtDate(r.renewalDate),
              String(r.daysToRenewal),
              formatRwf(r.premium, { compact: true }),
              { pill: humanize(r.status), tone: policyTone(r.status) },
            ])}
            rowActions={["View"]}
            onRowAction={(i, action) => {
              if (action === "View") setActive(data[i]);
            }}
          />
        )}
      </SectionCard>
      {active && <PolicyViewModal policy={active} onClose={() => setActive(null)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Claims                                                              */
/* ------------------------------------------------------------------ */

export function BrokerClaims() {
  const { data, error, refresh } = useRefreshableData<BrokerClaim[]>(getBrokerClaims);
  const [active, setActive] = useState<BrokerClaim | null>(null);

  if (error) return <ErrorPanel onRetry={refresh} />;
  if (!data) return <Loading label="Loading claims…" />;

  return (
    <div className="space-y-6">
      <SectionCard title="Client claims" description="Claims raised against policies in your book.">
        {data.length === 0 ? (
          <EmptyState title="No claims" body="Claims filed on your clients' policies will be tracked here." />
        ) : (
          <PaginatedDataTable
            columns={["Reference", "Client", "Policy", "Product", "Amount", "Status", "Filed"]}
            rows={data.map((c) => [
              c.reference,
              c.customerName,
              c.policyNumber,
              c.planName,
              formatRwf(c.amount, { compact: true }),
              { pill: humanize(c.status), tone: claimTone(c.status) },
              fmtDate(c.createdAt),
            ])}
            rowActions={["View"]}
            onRowAction={(i, action) => {
              if (action === "View") setActive(data[i]);
            }}
          />
        )}
      </SectionCard>

      {active && (
        <ModalShell title={active.reference} subtitle={`${active.customerName} · ${active.policyNumber}`} onClose={() => setActive(null)}>
          <dl className="grid gap-3 sm:grid-cols-2">
            <Detail label="Product">{active.planName}</Detail>
            <Detail label="Client email">{active.customerEmail}</Detail>
            <Detail label="Claimed amount">{formatRwf(active.amount)}</Detail>
            <Detail label="Status">{humanize(active.status)}</Detail>
            <Detail label="Incident date">{fmtDate(active.incidentDate)}</Detail>
            <Detail label="Filed">{fmtDate(active.createdAt)}</Detail>
          </dl>
          <div className="mt-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</h4>
            <p className="rounded-xl bg-muted px-4 py-3 text-sm">{active.description}</p>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Commissions                                                         */
/* ------------------------------------------------------------------ */

export function BrokerCommissions() {
  const { data, error, refresh } = useRefreshableData<BrokerCommission[]>(getBrokerCommissions);

  if (error) return <ErrorPanel onRetry={refresh} />;
  if (!data) return <Loading label="Loading commissions…" />;

  const pending = data.filter((c) => c.status === "pending").reduce((s, c) => s + c.amount, 0);
  const paid = data.filter((c) => c.status === "paid").reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <BrokerStatCard icon={Wallet} label="Pending commission" value={formatRwf(pending, { compact: true })} tone="warning" />
        <BrokerStatCard icon={ShieldCheck} label="Paid commission" value={formatRwf(paid, { compact: true })} tone="success" />
        <BrokerStatCard icon={TrendingUp} label="Placements" value={data.length.toLocaleString()} />
      </div>

      <SectionCard title="Commission ledger" description="Recorded automatically on each settled placement.">
        {data.length === 0 ? (
          <EmptyState title="No commissions yet" body="Commission entries appear as soon as a client's policy is issued." />
        ) : (
          <PaginatedDataTable
            columns={["Policy", "Client", "Product", "Premium", "Rate", "Amount", "Status", "Paid"]}
            rows={data.map((c) => [
              c.policyNumber,
              c.customerName,
              c.planName,
              formatRwf(c.premium, { compact: true }),
              `${c.rate}%`,
              formatRwf(c.amount, { compact: true }),
              { pill: humanize(c.status), tone: c.status === "paid" ? "success" : "warning" },
              c.paidAt ? fmtDate(c.paidAt) : "—",
            ])}
          />
        )}
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reports                                                             */
/* ------------------------------------------------------------------ */

export function BrokerReports() {
  const { data, error, refresh } = useRefreshableData<BrokerReports>(getBrokerReports);

  if (error) return <ErrorPanel onRetry={refresh} />;
  if (!data) return <Loading label="Building your report…" />;

  const t = data.totals;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <BrokerStatCard icon={ScrollText} label="Placements" value={t.policies.toLocaleString()} />
        <BrokerStatCard icon={TrendingUp} label="Placed premium" value={formatRwf(t.placedPremium, { compact: true })} />
        <BrokerStatCard icon={Wallet} label="Commission earned" value={formatRwf(t.commission, { compact: true })} tone="warning" />
        <BrokerStatCard icon={ShieldCheck} label="Commission paid" value={formatRwf(t.paidCommission, { compact: true })} tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ReportBreakdown title="By category" rows={data.byCategory} />
        <ReportBreakdown title="By provider" rows={data.byProvider} />
      </div>

      <SectionCard title="Monthly production" description={`Average premium ${formatRwf(t.averagePremium)}`}>
        {data.monthly.length === 0 ? (
          <EmptyState title="Nothing to report yet" body="Monthly production appears once you place policies." />
        ) : (
          <PaginatedDataTable
            columns={["Month", "Policies", "Premium", "Commission"]}
            rows={data.monthly.map((m) => [
              fmtMonth(m.month),
              String(m.policies),
              formatRwf(m.premium, { compact: true }),
              formatRwf(m.commission, { compact: true }),
            ])}
          />
        )}
      </SectionCard>
    </div>
  );
}

function ReportBreakdown({ title, rows }: { title: string; rows: BrokerReports["byCategory"] }) {
  if (rows.length === 0) {
    return (
      <SectionCard title={title}>
        <EmptyState title="No data yet" body="Placements will be summarised here." />
      </SectionCard>
    );
  }
  const max = Math.max(...rows.map((r) => r.premium), 1);
  return (
    <SectionCard title={title}>
      <ul className="divide-y divide-border">
        {rows.map((r) => (
          <li key={r.label} className="px-5 py-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">{r.label}</span>
              <span className="font-semibold">{formatRwf(r.premium, { compact: true })}</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((r.premium / max) * 100)}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {r.policies} policies · {formatRwf(r.commission, { compact: true })} commission
            </p>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export function BrokerSettingsModule() {
  const { data, error, refresh } = useRefreshableData<BrokerSettings>(getBrokerSettings);

  if (error) return <ErrorPanel onRetry={refresh} />;
  if (!data) return <Loading label="Loading settings…" />;

  return <SettingsForm key={data.email} initial={data} onSaved={refresh} />;
}

function SettingsForm({ initial, onSaved }: { initial: BrokerSettings; onSaved: () => void }) {
  const [name, setName] = useState(initial.name);
  const [company, setCompany] = useState(initial.company ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setErr(null);
    try {
      await updateBrokerSettings({ name, company, phone });
      setSaved(true);
      onSaved();
    } catch (error) {
      setErr(messageOf(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <BrokerStatCard icon={Users} label="Clients" value={initial.clientCount.toLocaleString()} />
        <BrokerStatCard icon={Wallet} label="Commission rate" value={`${initial.commissionRate}%`} tone="success" />
        <BrokerStatCard icon={Briefcase} label="Member since" value={fmtDate(initial.memberSince)} />
      </div>

      <SectionCard title="Agency profile" description="Details shown on your placements and correspondence.">
        <form className="space-y-4 px-5 py-5" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact name">
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Company">
              <input className={inputCls} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Kigali Risk Partners" />
            </Field>
            <Field label="Phone">
              <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250 …" />
            </Field>
            <Field label="Login email">
              <input className={cn(inputCls, "bg-muted")} value={initial.email} readOnly />
            </Field>
          </div>
          {err && <p className="text-sm font-medium text-destructive">{err}</p>}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-brand hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
            </button>
            {saved && <span className="text-sm font-medium text-success">Profile updated.</span>}
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Notifications" description="Commission and renewal updates are emailed to your login address.">
        <div className="flex items-center gap-3 px-5 py-4 text-sm text-muted-foreground">
          <ClipboardList className="h-4 w-4" />
          Updates are sent to <span className="font-semibold text-foreground">{initial.notificationEmail}</span>.
        </div>
      </SectionCard>
    </div>
  );
}
