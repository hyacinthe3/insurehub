import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { formatRwf } from "@/lib/insurance-data";
import { getMarketplaceProduct, type MarketplaceProduct } from "@/lib/api";

import ProductDetail from "./product-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ planId: string }>;
}): Promise<Metadata> {
  const { planId } = await params;
  let plan: MarketplaceProduct | undefined;
  try {
    plan = await getMarketplaceProduct(planId);
  } catch {
    plan = undefined;
  }
  const title = `${plan?.name ?? "Product"} — ${plan?.provider ?? "InsureHub"} | InsureHub`;
  return {
    title,
    description: plan
      ? `${plan.name} from ${plan.provider}: ${formatRwf(plan.monthly)}/mo, cover up to ${formatRwf(plan.coverAmount)}. Get a quote online.`
      : "Insurance product details on InsureHub.",
    openGraph: {
      title,
      description: plan?.highlights.join(" · ") ?? "Insurance product details on InsureHub.",
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  let hasPublished = false;
  try {
    const plan = await getMarketplaceProduct(planId);
    hasPublished = Boolean(plan && plan.id);
  } catch {
    hasPublished = false;
  }
  if (!hasPublished) notFound();
  return <ProductDetail planId={planId} />;
}
