import type { Metadata } from "next";

import QuoteSubmittedClient from "./quote-submitted-client";

export const metadata: Metadata = {
  title: "Quote request submitted | InsureHub",
  description: "Your quote request has been submitted to the insurance company for review.",
  robots: { index: false },
  openGraph: {
    title: "Quote request submitted | InsureHub",
    description: "Your InsureHub quote request has been submitted.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default async function QuoteSubmittedPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  return <QuoteSubmittedClient requestId={requestId} />;
}