"use client";

import { useState } from "react";
import Link from "next/link";

import {
  EmptyState,
  SectionCard,
  StatusPill,
} from "@/components/dashboard/ui-bits";
import { PaginatedDataTable } from "@/components/dashboard/paginated-data-table";
import type { Block } from "@/lib/workspace-data";
import { cn } from "@/lib/utils";

function ActionButtons({ actions }: { actions: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {actions.map((a, i) => (
        <button
          key={a}
          type="button"
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            i === 0
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "border border-input hover:bg-accent",
          )}
        >
          {a}
        </button>
      ))}
    </div>
  );
}

function TabbedTable({ block }: { block: Extract<Block, { kind: "tabs" }> }) {
  const [active, setActive] = useState(0);
  const tab = block.tabs[active];

  return (
    <SectionCard
      title={block.title}
      description={block.description}
      action={
        <div className="flex flex-wrap gap-1 rounded-full bg-muted p-1">
          {block.tabs.map((t, i) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                i === active
                  ? "bg-card text-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              <span className="ml-1.5 text-[10px] opacity-70">{t.rows.length}</span>
            </button>
          ))}
        </div>
      }
    >
      <div className="animate-in fade-in duration-300">
        {tab.rows.length === 0 ? (
          <EmptyState title={tab.emptyTitle} body={tab.emptyBody} action={tab.emptyAction} />
        ) : (
          <PaginatedDataTable columns={block.columns} rows={tab.rows} rowActions={block.rowActions} />
        )}
      </div>
    </SectionCard>
  );
}

export function BlockRenderer({ block }: { block: Block }) {
  if (block.kind === "tabs") return <TabbedTable block={block} />;

  if (block.kind === "table") {
    return (
      <SectionCard title={block.title} description={block.description}>
        {block.rows.length === 0 ? (
          <EmptyState
            title={block.emptyTitle ?? "Nothing here yet"}
            body={block.emptyBody ?? "Records will appear here as soon as there's activity."}
          />
        ) : (
          <PaginatedDataTable columns={block.columns} rows={block.rows} rowActions={block.rowActions} />
        )}
      </SectionCard>
    );
  }

  if (block.kind === "queue") {
    return (
      <SectionCard title={block.title} description={block.description}>
        {block.items.length === 0 ? (
          <EmptyState title={block.emptyTitle} body={block.emptyBody} />
        ) : (
          <ul className="divide-y divide-border">
            {block.items.map((item) => (
              <li key={item.title} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{item.title}</p>
                      <StatusPill label={item.status} tone={item.tone} />
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{item.meta}</p>
                    <p className="mt-1 text-sm">{item.detail}</p>
                    {item.timeline && (
                      <ol className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        {item.timeline.map((step, i) => (
                          <li key={step} className="flex items-center gap-2">
                            {i > 0 && <span className="text-border">→</span>}
                            <span className="rounded-full bg-muted px-2 py-0.5 font-medium">{step}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                  <ActionButtons actions={block.actions} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    );
  }

  return (
    <SectionCard title={block.title} description={block.description}>
      <div className="px-5 py-5">
        <ul className="space-y-2.5 text-sm">
          {block.points.map((point) => (
            <li key={point} className="flex gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
        {block.action &&
          (block.action.to ? (
            <Link
              href={block.action.to}
              className="mt-5 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-brand"
            >
              {block.action.label}
            </Link>
          ) : (
            <button
              type="button"
              className={cn(
                "mt-5 inline-flex rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                block.action.primary
                  ? "bg-primary text-primary-foreground shadow-brand hover:bg-primary/90"
                  : "border border-input hover:bg-accent",
              )}
            >
              {block.action.label}
            </button>
          ))}
      </div>
    </SectionCard>
  );
}
