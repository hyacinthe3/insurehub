import type { Metadata } from "next";

import CompaniesClient from "./companies-client";

export const metadata: Metadata = {
  title: "Insurance providers in Rwanda | InsureHub",
  description:
    "Browse licensed insurance companies on InsureHub, compare their ratings and claim speed, and buy cover online in RWF.",
  openGraph: {
    title: "Insurance providers in Rwanda | InsureHub",
    description: "Search licensed insurers, view their products and buy a policy end to end.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function CompaniesPage() {
  return <CompaniesClient />;
}
