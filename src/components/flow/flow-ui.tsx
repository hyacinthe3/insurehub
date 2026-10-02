"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, CheckCircle2, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { getDraft } from "@/lib/api";
import { stepLabels, stepOrder, type DraftQuote, type QuoteStep } from "@/lib/quote-flow";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} />;
}

export function FlowSteps({ current }: { current: QuoteStep }) {
  const index = stepOrder.indexOf(current);
  return (
    <ol className="flex flex-wrap items-center gap-2 text-xs font-semibold">
      {stepOrder.map((step, i) => {
        const done = i < index;
        const active = i === index;
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-colors cursor-pointer hover:opacity-80",
                active && "border-primary bg-primary text-primary-foreground",
                done && "border-success/30 bg-success/12 text-success",
                !active && !done && "border-border bg-card text-muted-foreground",
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : <span className="text-[11px]">{i + 1}</span>}
              {stepLabels[step]}
            </span>
            {i < stepOrder.length - 1 && <span className="h-px w-4 bg-border" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

export function FlowShell({
  eyebrow,
  title,
  description,
  step,
  children,
  aside,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  step: QuoteStep;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="px-5 py-10 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <FlowSteps current={step} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className={cn("grid gap-6", aside && "lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]")}>
          <div className="space-y-6">{children}</div>
          {aside && <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">{aside}</div>}
        </div>
      </div>
    </section>
  );
}

export function Notice({
  tone = "info",
  title,
  body,
  action,
}: {
  tone?: "info" | "danger" | "success" | "warning";
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  const toneClass = {
    info: "border-primary/25 bg-primary/8 text-foreground",
    danger: "border-destructive/30 bg-destructive/8 text-foreground",
    success: "border-success/30 bg-success/10 text-foreground",
    warning: "border-warning/30 bg-warning/12 text-foreground",
  }[tone];
  const Icon = tone === "danger" ? AlertTriangle : tone === "success" ? CheckCircle2 : AlertTriangle;

  return (
    <div className={cn("flex flex-wrap items-start gap-3 rounded-2xl border p-4", toneClass)} role="status">
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          tone === "danger" && "text-destructive",
          tone === "success" && "text-success",
          tone === "info" && "text-primary",
          tone === "warning" && "text-warning-foreground",
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        {body && <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>}
      </div>
      {action}
    </div>
  );
}

export function Field({
  label,
  error,
  help,
  children,
}: {
  label: string;
  error?: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-medium text-destructive">{error}</span>
      ) : help ? (
        <span className="mt-1 block text-xs text-muted-foreground">{help}</span>
      ) : null}
    </label>
  );
}

export const inputClass =
  "mt-1.5 h-11 w-full rounded-2xl border border-input bg-card px-4 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30";

export function FlowLoading({ label = "Loading your quote…" }: { label?: string }) {
  return (
    <section className="px-5 py-24 lg:px-8">
      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
        <Spinner className="h-6 w-6 text-primary" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </section>
  );
}

export function FlowError({
  title,
  body,
  to = "/companies",
  actionLabel = "Back to providers",
}: {
  title: string;
  body: string;
  to?: string;
  actionLabel?: string;
}) {
  return (
    <section className="px-5 py-20 lg:px-8">
      <div className="surface mx-auto max-w-lg p-8 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-destructive/10">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </span>
        <h1 className="mt-4 text-xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        <Link
          href={to}
          className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand"
        >
          {actionLabel}
        </Link>
      </div>
    </section>
  );
}

/** Loads a saved draft quote from the API so the flow is resumable. */
export function useDraft(quoteId: string) {
  const [state, setState] = useState<{ status: "loading" | "ready" | "missing"; draft: DraftQuote | null }>({
    status: "loading",
    draft: null,
  });

  useEffect(() => {
    let cancelled = false;
    getDraft(quoteId)
      .then((draft) => {
        if (!cancelled) setState({ status: "ready", draft });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "missing", draft: null });
      });
    return () => {
      cancelled = true;
    };
  }, [quoteId]);

  return {
    ...state,
    setDraft: (draft: DraftQuote) => setState({ status: "ready", draft }),
  };
}
