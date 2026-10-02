import { Suspense } from "react";
import type { Metadata } from "next";
import CompareClient from "./compare-client";
import { Spinner } from "@/components/flow/flow-ui";

export const metadata: Metadata = {
  title: "Compare insurance policies side by side — InsureHub",
  description:
    "Compare premiums, cover limits, excess, and benefits across insurance providers in one clear table before you buy.",
  openGraph: {
    title: "Compare insurance policies side by side — InsureHub",
    description: "A clear, honest comparison of cover, excess, and claim times across providers.",
  },
};

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-5 py-16 text-center">
          <Spinner />
          <p className="mt-3 text-sm text-muted-foreground">Loading compare workspace…</p>
        </div>
      }
    >
      <CompareClient />
    </Suspense>
  );
}
