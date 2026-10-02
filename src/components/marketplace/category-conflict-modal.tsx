"use client";

import React from "react";
import { AlertTriangle, ArrowRight, X } from "lucide-react";
import { useCompare } from "@/context/compare-context";
import { Button } from "@/components/ui/button";

export function CategoryConflictModal() {
  const { categoryConflict, resolveCategoryConflict } = useCompare();

  if (!categoryConflict) return null;

  const { incomingProduct, currentCategoryName } = categoryConflict;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="surface relative w-full max-w-md p-6 shadow-lift rounded-2xl border border-border bg-background animate-in zoom-in-95 duration-200">
        <button
          onClick={() => resolveCategoryConflict("cancel")}
          className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Category Mismatch</h3>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Comparison is only allowed between products in the same insurance category.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Your comparison drawer currently has <span className="font-semibold text-foreground">{currentCategoryName}</span> products. Adding{" "}
              <span className="font-semibold text-primary">{incomingProduct.name}</span> (<span className="font-semibold text-foreground">{incomingProduct.category}</span>) requires clearing your current selections.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => resolveCategoryConflict("cancel")}
            className="text-xs"
          >
            Keep Existing Selections
          </Button>
          <Button
            size="sm"
            onClick={() => resolveCategoryConflict("switch")}
            className="gap-1.5 text-xs font-bold shadow-brand"
          >
            Clear & Compare {incomingProduct.category} <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
