import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getMarketplaceCompanies, getMarketplaceProducts } from "@/lib/api";

import CompanyProfile from "./company-profile";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let companies: Awaited<ReturnType<typeof getMarketplaceCompanies>> = [];
  try {
    companies = await getMarketplaceCompanies();
  } catch {
    // ignore
  }
  const company = companies.find((c) => c.slug === slug);
  const title = `${company?.name ?? "Provider"} — products & premiums | InsureHub`;
  return {
    title,
    description:
      company?.tagline ??
      "View this provider's insurance products, premiums in RWF and claim performance on InsureHub.",
    openGraph: {
      title,
      description: company?.about ?? "Insurance provider profile on InsureHub.",
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let companies: Awaited<ReturnType<typeof getMarketplaceCompanies>> = [];
  try {
    companies = await getMarketplaceCompanies();
  } catch {
    notFound();
  }
  const company = companies.find((c) => c.slug === slug);
  if (!company) notFound();
  return <CompanyProfile company={company} />;
}
