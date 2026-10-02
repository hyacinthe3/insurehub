import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

const toneClass: Record<StatusTone, string> = {
  success: "bg-success/12 text-success border-success/25",
  warning: "bg-warning/14 text-warning-foreground border-warning/30",
  danger: "bg-destructive/10 text-destructive border-destructive/25",
  info: "bg-primary/10 text-primary border-primary/25",
  neutral: "bg-muted text-muted-foreground border-border",
};

export function StatusPill({ label, tone = "neutral" }: { label: string; tone?: StatusTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        toneClass[tone],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  actions?: { label: string; to?: string; primary?: boolean }[];
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-brand">
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {description && (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => {
            const className = cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              action.primary
                ? "bg-primary text-primary-foreground shadow-brand hover:bg-primary/90"
                : "border border-input hover:bg-accent hover:text-accent-foreground",
            );
            return action.to ? (
              <Link key={action.label} href={action.to} className={className}>
                {action.label}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <button key={action.label} type="button" className={className}>
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: StatusTone;
}) {
  return (
    <div className="surface p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-bold tracking-tight",
          tone === "danger" && "text-destructive",
          tone === "warning" && "text-warning-foreground",
          tone === "success" && "text-success",
        )}
      >
        {value}
      </p>
      {delta && <p className="mt-1 text-xs font-medium text-muted-foreground">{delta}</p>}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="surface overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; to?: string };
}) {
  return (
    <div className="px-5 py-12 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-muted">
        <Inbox className="h-5 w-5 text-muted-foreground" />
      </span>
      <p className="mt-4 font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
      {action &&
        (action.to ? (
          <Link
            href={action.to}
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-brand"
          >
            {action.label}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <button
            type="button"
            className="mt-5 inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-brand"
          >
            {action.label}
          </button>
        ))}
    </div>
  );
}

export type TableCell = string | { pill: string; tone: StatusTone };

import { RowActionsMenu } from "./row-actions-menu";

export function DataTable({
  columns,
  rows,
  rowActions,
  rowActionDisabled,
  onRowAction,
}: {
  columns: string[];
  rows: TableCell[][];
  rowActions?: string[];
  rowActionDisabled?: (rowIndex: number, action: string) => boolean;
  onRowAction?: (rowIndex: number, action: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/60 text-left">
            {columns.map((c) => (
              <th key={c} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {c}
              </th>
            ))}
            {rowActions && <th className="px-5 py-3" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, i) => (
            <tr key={i} className="transition-colors hover:bg-muted/40">
              {row.map((cell, j) => (
                <td key={j} className={cn("px-5 py-3.5", j === 0 && "font-medium")}>
                  {typeof cell === "string" ? cell : <StatusPill label={cell.pill} tone={cell.tone} />}
                </td>
              ))}
              {rowActions && (
                <td className="px-5 py-3.5 text-right">
                  <RowActionsMenu
                    actions={rowActions}
                    disabled={rowActionDisabled ? (action) => rowActionDisabled(i, action) : undefined}
                    onSelect={(action) => onRowAction?.(i, action)}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
