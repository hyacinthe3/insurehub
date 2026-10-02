"use client";

import Link from "next/link";
import { Check, Eye, EyeOff, ShieldCheck, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  wide,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <section className="relative overflow-hidden px-5 py-12 lg:px-8 lg:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-80 bg-primary/10 blur-3xl"
      />
      <div
        className={cn(
          "relative mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-500",
          wide ? "max-w-3xl" : "max-w-md",
        )}
      >
        <div className="mb-7 text-center">
          <span className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-brand">
            <ShieldCheck className="h-6 w-6" />
          </span>
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-2 text-balance-tight text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mx-auto mt-2.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        <div className="surface p-6 sm:p-8">{children}</div>

        {footer && (
          <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
        )}

        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          Bank-grade encryption · ISO 27001 · GDPR compliant
        </p>
      </div>
    </section>
  );
}

export function GoogleButton({ label = "Continue with Google" }: { label?: string }) {
  return (
    <Button type="button" variant="outline" className="w-full">
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path
          fill="#4285F4"
          d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.8Z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8H1.3v3.1A12 12 0 0 0 12 24Z"
        />
        <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z" />
        <path
          fill="#EA4335"
          d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.5-3.5A12 12 0 0 0 1.3 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8Z"
        />
      </svg>
      {label}
    </Button>
  );
}

export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">or</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function scorePassword(value: string) {
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return Math.min(score, 5);
}

const strengthLabels = ["Too short", "Weak", "Fair", "Good", "Strong", "Excellent"];

export function PasswordField({
  id,
  label = "Password",
  value,
  onChange,
  withStrength,
  error,
  autoComplete = "current-password",
  placeholder = "••••••••••••",
}: {
  id: string;
  label?: string;
  value: string;
  onChange: (v: string) => void;
  withStrength?: boolean;
  error?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  const score = useMemo(() => scorePassword(value), [value]);

  const rules = [
    { label: "At least 8 characters", ok: value.length >= 8 },
    { label: "Upper & lowercase letters", ok: /[A-Z]/.test(value) && /[a-z]/.test(value) },
    { label: "A number", ok: /\d/.test(value) },
    { label: "A symbol", ok: /[^A-Za-z0-9]/.test(value) },
  ];

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="pr-11"
          aria-invalid={Boolean(error)}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {error && <p className="text-xs font-medium text-destructive">{error}</p>}

      {withStrength && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all duration-300",
                  i < score
                    ? score <= 2
                      ? "bg-destructive"
                      : score === 3
                        ? "bg-warning"
                        : "bg-success"
                    : "bg-border",
                )}
              />
            ))}
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            Strength: <span className="text-foreground">{strengthLabels[score]}</span>
          </p>
          <ul className="grid gap-1 sm:grid-cols-2">
            {rules.map((rule) => (
              <li
                key={rule.label}
                className={cn(
                  "flex items-center gap-1.5 text-xs transition-colors",
                  rule.ok ? "text-success" : "text-muted-foreground",
                )}
              >
                {rule.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                {rule.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function StatusNote({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "warning" | "error";
  children: ReactNode;
}) {
  const tones = {
    info: "bg-primary-soft text-accent-foreground",
    success: "bg-success/15 text-foreground",
    warning: "bg-warning/15 text-foreground",
    error: "bg-destructive/10 text-destructive",
  } as const;
  return (
    <div className={cn("rounded-xl px-4 py-3 text-sm leading-relaxed", tones[tone])}>
      {children}
    </div>
  );
}

export function AuthLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link href={to} className="font-semibold text-primary underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}

export function OtpInput({
  length = 6,
  value,
  onChange,
}: {
  length?: number;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex justify-center gap-2 sm:gap-2.5">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          inputMode="numeric"
          maxLength={1}
          aria-label={`Digit ${i + 1}`}
          value={value[i] ?? ""}
          onChange={(e) => {
            const digit = e.target.value.replace(/\D/g, "").slice(-1);
            const next = (value.padEnd(length, " ").slice(0, length).split("") as string[]);
            next[i] = digit || " ";
            onChange(next.join("").replace(/ /g, ""));
            const sibling = e.target.nextElementSibling as HTMLInputElement | null;
            if (digit && sibling) sibling.focus();
          }}
          className="h-13 w-11 rounded-xl border border-input bg-card text-center text-lg font-semibold shadow-soft outline-none transition-all focus:border-primary focus:ring-2 focus:ring-ring/40 sm:h-14 sm:w-12"
        />
      ))}
    </div>
  );
}
