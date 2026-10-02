"use client";

/** Right-hand context panel: the application, policy or product under discussion. */

import Link from "next/link";
import { ExternalLink, FileText, ShieldCheck } from "lucide-react";

import type { ConversationDetail } from "@/lib/api";
import { contextBadge } from "./messaging-shared";

export function ContextPanel({ conversation }: { conversation: ConversationDetail }) {
  const { context } = conversation;
  if (!context) return null;

  return (
    <aside className="hidden w-80 shrink-0 border-l border-border bg-card/60 xl:block">
      <div className="sticky top-0 max-h-[calc(100vh-3.5rem)] overflow-y-auto p-4">
        <div className="flex items-center gap-2">
          {contextBadge(context.type, context.type === "policy" ? "Policy" : context.type === "quote" ? "Application" : "Product")}
          {context.reference && (
            <span className="truncate text-[11px] font-semibold text-muted-foreground">
              {context.reference}
            </span>
          )}
        </div>

        <h3 className="mt-2 text-sm font-bold leading-tight">{context.title}</h3>
        {context.subtitle && <p className="text-xs text-muted-foreground">{context.subtitle}</p>}

        {context.fields.length > 0 && (
          <dl className="mt-4 space-y-2.5">
            {context.fields.map((field) => (
              <div key={`${field.label}-${field.value}`} className="min-w-0">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {field.label}
                </dt>
                <dd className="truncate text-sm font-medium capitalize">{field.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {context.links.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {context.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold transition-colors hover:border-primary hover:text-primary"
              >
                <span className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  {link.label}
                </span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            ))}
          </div>
        )}

        <div className="mt-5 rounded-lg border border-border bg-muted/50 p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Private channel
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            This thread and its files are visible only to you and your broker. Access is recorded.
          </p>
        </div>
      </div>
    </aside>
  );
}
