"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  Package,
  ScrollText,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import {
  EmptyState,
  SectionCard,
  type TableCell,
} from "@/components/dashboard/ui-bits";
import { PaginatedDataTable } from "@/components/dashboard/paginated-data-table";
import { getAdminOverview, type AdminOverview as AdminOverviewData } from "@/lib/api";
import { formatRwf } from "@/lib/insurance-data";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Color palette for charts                                             */
/* ------------------------------------------------------------------ */

const CHART_COLORS = [
  "oklch(0.488 0.217 264.4)", // primary blue
  "oklch(0.723 0.192 149.6)", // success green
  "oklch(0.769 0.188 70.08)", // warning amber
  "oklch(0.637 0.237 25.3)",  // danger red
  "oklch(0.554 0.046 257.4)", // muted slate
];

/* ------------------------------------------------------------------ */
/* Sparkline area chart (SVG, no deps)                                 */
/* ------------------------------------------------------------------ */

function SparklineChart({
  data,
  width = 280,
  height = 80,
  color = "oklch(0.488 0.217 264.4)",
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pad = 4;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = pad + ((1 - (v - min) / range) * (height - pad * 2));
    return [x, y] as [number, number];
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ");

  const areaPath = [
    `M ${points[0][0]} ${height}`,
    ...points.map(([x, y]) => `L ${x} ${y}`),
    `L ${points[points.length - 1][0]} ${height}`,
    "Z",
  ].join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color.slice(0, 8).replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={areaPath}
        fill={`url(#grad-${color.slice(0, 8).replace(/\s/g, "")})`}
      />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      {points[points.length - 1] && (
        <circle
          cx={points[points.length - 1][0]}
          cy={points[points.length - 1][1]}
          r="3.5"
          fill={color}
        />
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Mini bar chart                                                       */
/* ------------------------------------------------------------------ */

function MiniBarChart({
  data,
  height = 60,
  color = "oklch(0.488 0.217 264.4)",
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map(({ label, value }) => {
        const pct = (value / max) * 100;
        return (
          <div
            key={label}
            title={`${label}: ${value}`}
            className="flex-1 rounded-t-sm transition-all duration-500"
            style={{
              height: `${Math.max(pct, 4)}%`,
              backgroundColor: color,
              opacity: pct === 0 ? 0.2 : 0.8,
            }}
          />
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Donut chart                                                          */
/* ------------------------------------------------------------------ */

function DonutChart({
  data,
  size = 120,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  const r = 42;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const slices = data.map((d) => {
    const fraction = d.value / total;
    const dash = fraction * circumference;
    const gap = circumference - dash;
    const rotate = offset * 360;
    offset += fraction;
    return { ...d, dash, gap, rotate };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((slice, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={slice.color}
          strokeWidth="20"
          strokeDasharray={`${slice.dash} ${slice.gap}`}
          strokeDashoffset={circumference * 0.25}
          transform={`rotate(${slice.rotate} ${cx} ${cy})`}
          className="transition-all duration-700"
        />
      ))}
      {/* Center label */}
      <text x={cx} y={cy - 5} textAnchor="middle" className="text-xs fill-foreground font-bold" style={{ fontSize: 14, fontWeight: 700 }}>
        {data.length}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" style={{ fontSize: 9, fill: "oklch(0.554 0.046 257.4)" }}>
        categories
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Stat card                                                            */
/* ------------------------------------------------------------------ */

type StatCardProps = {
  icon: typeof Users;
  label: string;
  value: string | number;
  delta?: string;
  tone?: "primary" | "success" | "warning" | "danger";
  chart?: number[];
  href?: string;
  badge?: string;
};

function RichStatCard({ icon: Icon, label, value, delta, tone = "primary", chart, href, badge }: StatCardProps) {
  const tones = {
    primary: {
      icon: "bg-primary/10 text-primary",
      value: "text-foreground",
      accent: "oklch(0.488 0.217 264.4)",
    },
    success: {
      icon: "bg-success/10 text-success",
      value: "text-success",
      accent: "oklch(0.723 0.192 149.6)",
    },
    warning: {
      icon: "bg-warning/12 text-warning-foreground",
      value: "text-warning-foreground",
      accent: "oklch(0.769 0.188 70.08)",
    },
    danger: {
      icon: "bg-destructive/10 text-destructive",
      value: "text-destructive",
      accent: "oklch(0.637 0.237 25.3)",
    },
  }[tone];

  const inner = (
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
        {href && (
          <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={cn("mt-1 text-2xl font-bold tracking-tight", tones.value)}>{value}</p>
        {delta && <p className="mt-0.5 text-xs text-muted-foreground">{delta}</p>}
      </div>

      {chart && chart.length > 1 && (
        <div className="mt-auto">
          <SparklineChart data={chart} width={200} height={44} color={tones.accent} />
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{inner}</Link>;
  }
  return inner;
}

/* ------------------------------------------------------------------ */
/* Policy trend chart section                                           */
/* ------------------------------------------------------------------ */

function PolicyTrendSection({
  monthly,
}: {
  monthly: { month: string; count: number; premium: number }[];
}) {
  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const labels = monthly.map((m) => {
    const [y, mo] = m.month.split("-");
    return MONTH_NAMES[parseInt(mo) - 1] + (y !== String(new Date().getFullYear()) ? ` '${y.slice(2)}` : "");
  });
  const counts = monthly.map((m) => m.count);
  const premiums = monthly.map((m) => m.premium);
  const maxCount = Math.max(...counts, 1);

  return (
    <div className="surface overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
          <TrendingUp className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold">Policy Issuance Trend</h2>
          <p className="text-xs text-muted-foreground">New policies per month — last 6 months</p>
        </div>
      </div>
      <div className="px-5 py-5">
        {/* Bar chart */}
        <div className="flex items-end gap-2 h-32">
          {monthly.map((m, i) => {
            const h = counts[i] === 0 ? 4 : Math.max((counts[i] / maxCount) * 100, 8);
            return (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  {counts[i] > 0 ? counts[i] : ""}
                </span>
                <div
                  title={`${labels[i]}: ${counts[i]} policies · ${formatRwf(premiums[i], { compact: true })}`}
                  className="w-full rounded-t-lg transition-all duration-700"
                  style={{
                    height: `${h}%`,
                    background: `linear-gradient(180deg, oklch(0.488 0.217 264.4) 0%, oklch(0.623 0.214 259.8) 100%)`,
                    opacity: counts[i] === 0 ? 0.2 : 1,
                  }}
                />
              </div>
            );
          })}
        </div>
        {/* Labels */}
        <div className="mt-2 flex gap-2">
          {labels.map((l) => (
            <span key={l} className="flex-1 text-center text-xs text-muted-foreground">
              {l}
            </span>
          ))}
        </div>
        {/* Premium totals */}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
          {monthly.map((m, i) => (
            <div key={m.month} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary/60" />
              <span className="text-xs text-muted-foreground">
                {labels[i]}: <span className="font-medium text-foreground">{formatRwf(m.premium, { compact: true })}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Premium by category chart                                            */
/* ------------------------------------------------------------------ */

function PremiumByCategorySection({
  data,
}: {
  data: { category: string; total: number }[];
}) {
  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  const totalPremium = data.reduce((a, b) => a + b.total, 0);
  const donutData = data.slice(0, 5).map((d, i) => ({
    label: d.category,
    value: d.total,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div className="surface overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-success/10 text-success">
          <BarChart3 className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold">Premium by Category</h2>
          <p className="text-xs text-muted-foreground">Revenue breakdown — last 6 months</p>
        </div>
      </div>
      <div className="px-5 py-5">
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No premium data yet.</p>
        ) : (
          <div className="flex gap-6 items-start flex-wrap">
            {/* Donut */}
            <div className="shrink-0">
              <DonutChart data={donutData} size={130} />
            </div>
            {/* Bar rows */}
            <div className="flex-1 min-w-0 space-y-3">
              {data.slice(0, 5).map((d, i) => {
                const pct = (d.total / maxTotal) * 100;
                const share = ((d.total / totalPremium) * 100).toFixed(1);
                return (
                  <div key={d.category}>
                    <div className="flex justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        <span className="text-xs font-medium capitalize">{d.category}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatRwf(d.total, { compact: true })} · {share}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                       */
/* ------------------------------------------------------------------ */

export default function AdminOverview() {
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAdminOverview()
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <p className="text-sm text-muted-foreground">
        No results found.
      </p>
    );
  }
  if (!data) {
    return (
      <div className="space-y-6">
        {/* Skeleton stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="surface p-5 space-y-3 animate-pulse">
              <div className="h-10 w-10 rounded-xl bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
              <div className="h-7 w-1/3 rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="surface p-5 space-y-3 animate-pulse h-48">
            <div className="h-4 w-1/3 rounded bg-muted" />
            <div className="h-32 w-full rounded bg-muted" />
          </div>
          <div className="surface p-5 space-y-3 animate-pulse h-48">
            <div className="h-4 w-1/3 rounded bg-muted" />
            <div className="h-32 w-full rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  const t = data.totals;
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const monthlyCounts = (data.monthlyPolicyCounts ?? []).map((m) => m.count);

  return (
    <div className="space-y-6">
      {/* ---- Stat cards row 1 ---- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <RichStatCard
          icon={Users}
          label="Platform Users"
          value={t.users.toLocaleString()}
          delta={`${t.customers + t.businesses} policyholders · ${t.insurers + t.brokers} partners`}
          tone="primary"
          chart={monthlyCounts}
        />
        <RichStatCard
          icon={ShieldCheck}
          label="Policies in Force"
          value={t.activePolicies.toLocaleString()}
          delta={`${t.policies - t.activePolicies} expired of ${t.policies} total issued`}
          tone="success"
          chart={monthlyCounts}
        />
        <RichStatCard
          icon={Wallet}
          label="Lifetime Premium Collected"
          value={formatRwf(t.premiumTotal, { compact: true })}
          delta={`across ${t.policies} policies`}
          tone="primary"
        />
        <RichStatCard
          icon={Building2}
          label="Insurance Partners"
          value={t.providers.toLocaleString()}
          delta={`${t.products} products across ${t.categories} categories`}
          tone="success"
        />
        <RichStatCard
          icon={ScrollText}
          label="Total Policies Issued"
          value={t.policies.toLocaleString()}
          delta={`${t.activePolicies} currently active`}
          tone="primary"
        />
        <RichStatCard
          icon={Clock}
          label="Pending Applications"
          value={(t.pendingApplications ?? 0).toLocaleString()}
          delta={(t.pendingApplications ?? 0) > 0 ? "Awaiting admin review" : "No pending applications"}
          tone={(t.pendingApplications ?? 0) > 0 ? "warning" : "success"}
          badge={(t.pendingApplications ?? 0) > 0 ? `${t.pendingApplications} new` : undefined}
          href="/dashboard/admin/companies"
        />
      </div>

      {/* ---- User role breakdown ---- */}
      <div className="surface overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
            <Users className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold">User Breakdown by Role</h2>
            <p className="text-xs text-muted-foreground">{t.users} total registered accounts</p>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "Customers", value: t.customers, icon: Users, color: "text-primary" },
            { label: "Businesses", value: t.businesses, icon: Building2, color: "text-success" },
            { label: "Insurers", value: t.insurers, icon: ShieldCheck, color: "text-warning-foreground" },
            { label: "Brokers", value: t.brokers, icon: Package, color: "text-primary" },
            { label: "Admins", value: t.admins, icon: CheckCircle2, color: "text-destructive" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="p-4 text-center">
              <Icon className={cn("mx-auto h-4 w-4 mb-2", color)} />
              <p className={cn("text-xl font-bold", color)}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ---- Charts row ---- */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PolicyTrendSection monthly={data.monthlyPolicyCounts ?? []} />
        <PremiumByCategorySection data={data.premiumByCategory ?? []} />
      </div>

      {/* ---- Pending applications alert ---- */}
      {(t.pendingApplications ?? 0) > 0 && (
        <div className="flex items-center gap-4 rounded-2xl border border-warning/30 bg-warning/8 px-5 py-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning-foreground" />
          <div className="flex-1">
            <p className="font-semibold text-warning-foreground">
              {t.pendingApplications} insurance application{t.pendingApplications !== 1 ? "s" : ""} awaiting review
            </p>
            <p className="text-sm text-warning-foreground/80">
              New insurers are waiting for approval to access the platform.
            </p>
          </div>
          <Link
            href="/dashboard/admin/companies"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-warning-foreground/10 border border-warning/30 px-4 py-2 text-sm font-semibold text-warning-foreground transition-colors hover:bg-warning/15"
          >
            Review now
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* ---- Recent policies table ---- */}
      <SectionCard
        title="Newest Issued Policies"
        description="The most recent premiums collected on the marketplace."
      >
        {data.recentPolicies.length === 0 ? (
          <EmptyState
            title="No policies yet"
            body="Policies purchased through InsureHub will appear here as soon as they are paid for."
          />
        ) : (
          <PaginatedDataTable
            columns={["Policy", "Holder", "Plan", "Provider", "Premium", "Issued", "Expires", "Status"]}
            rows={data.recentPolicies.map(
              (policy): TableCell[] => [
                policy.policyNumber,
                policy.holderName,
                policy.planName,
                policy.provider,
                formatRwf(policy.premium),
                formatDate(policy.paidAt),
                formatDate(policy.endDate),
                policy.active
                  ? { pill: "Active", tone: "success" }
                  : { pill: "Expired", tone: "neutral" },
              ],
            )}
          />
        )}
      </SectionCard>
    </div>
  );
}
