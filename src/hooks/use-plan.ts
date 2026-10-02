"use client";

import { useEffect, useState } from "react";

import { getMarketplaceProduct, type MarketplaceProduct } from "@/lib/api";

export type PlanStatus = "loading" | "ready" | "missing";

/**
 * Fetches the published marketplace product for a given planId from the backend.
 * Replaces the old synchronous `getPlan(planId)` from companies-data.ts which
 * only searched a hard-coded local list and missed any DB-sourced products.
 */
export function usePlan(planId: string | undefined): {
  planStatus: PlanStatus;
  plan: MarketplaceProduct | null;
} {
  const [plan, setPlan] = useState<MarketplaceProduct | null>(null);
  const [planStatus, setPlanStatus] = useState<PlanStatus>("loading");

  useEffect(() => {
    if (!planId) {
      setPlanStatus("missing");
      return;
    }
    let cancelled = false;
    setPlanStatus("loading");
    getMarketplaceProduct(planId)
      .then((p) => {
        if (!cancelled) {
          setPlan(p);
          setPlanStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPlan(null);
          setPlanStatus("missing");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [planId]);

  return { planStatus, plan };
}
