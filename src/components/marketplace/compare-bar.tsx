"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Scale, Trash2, X } from "lucide-react";
import { useCompare } from "@/context/compare-context";
import { Button } from "@/components/ui/button";
import { formatRwf } from "@/lib/insurance-data";
import { CategoryConflictModal } from "./category-conflict-modal";

export function CompareBar() {
  const { selectedProducts, removeProduct, clearCompare, categoryName } = useCompare();

  if (selectedProducts.length === 0) {
    return <CategoryConflictModal />;
  }

  const compareUrl = `/compare?ids=${selectedProducts.map((p) => encodeURIComponent(p.id)).join(",")}`;
  const count = selectedProducts.length;

  return (
    <>
      <CategoryConflictModal />
      <div className="fixed bottom-4 left-1/2 z-50 w-[95%] max-w-4xl -translate-x-1/2 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="surface flex flex-col gap-3 p-4 shadow-lift backdrop-blur-xl border border-primary/20 bg-background/95 rounded-2xl md:flex-row md:items-center md:justify-between">
          {/* Header & Category info */}
          <div className="flex items-center justify-between md:justify-start md:gap-4 border-b border-border/50 pb-2 md:border-b-0 md:pb-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Product Comparison
                  </span>
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-extrabold text-primary-foreground">
                    {count} / 4
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Category: <span className="font-semibold text-foreground">{categoryName}</span>
                </p>
              </div>
            </div>
            <button
              onClick={clearCompare}
              className="text-xs text-muted-foreground hover:text-destructive md:hidden flex items-center gap-1"
              title="Clear comparison list"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </button>
          </div>

          {/* Product Chips */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            {selectedProducts.map((product) => (
              <div
                key={product.id}
                className="group flex shrink-0 items-center gap-2 rounded-xl bg-muted/80 px-3 py-1.5 text-xs border border-border/60 transition-colors hover:border-primary/40"
              >
                <div className="min-w-0 max-w-[140px]">
                  <p className="truncate font-bold text-foreground text-[11px]">{product.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{formatRwf(product.monthly)}/mo</p>
                </div>
                <button
                  onClick={() => removeProduct(product.id)}
                  className="rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  aria-label={`Remove ${product.name} from comparison`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {/* Empty slots indicator if count < 4 */}
            {Array.from({ length: 4 - count }).map((_, idx) => (
              <div
                key={idx}
                className="hidden md:flex shrink-0 items-center justify-center rounded-xl border border-dashed border-border px-3 py-2 text-[11px] text-muted-foreground/60 font-medium"
              >
                + Add product
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 shrink-0 border-t border-border/50 pt-2 md:border-t-0 md:pt-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCompare}
              className="hidden md:inline-flex text-xs text-muted-foreground hover:text-destructive gap-1"
            >
              Clear All
            </Button>
            <Button
              asChild
              disabled={count < 2}
              className="gap-2 font-bold shadow-brand text-xs h-9 px-4 disabled:opacity-50"
            >
              <Link href={compareUrl}>
                <span>{count < 2 ? "Select at least 2 to compare" : `Compare (${count})`}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
