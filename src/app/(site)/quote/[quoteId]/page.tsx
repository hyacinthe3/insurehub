import type { Metadata } from "next";

import QuoteClient from "./quote-client";

export const metadata: Metadata = {
  title: "Your quote details | InsureHub",
  description: "Answer a few questions so InsureHub can price your cover accurately in RWF.",
  robots: { index: false },
  openGraph: {
    title: "Your quote details | InsureHub",
    description: "Get an accurate insurance premium in a couple of minutes.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default async function QuotePage({
  params,
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const { quoteId } = await params;
  return <QuoteClient quoteId={quoteId} />;
}
