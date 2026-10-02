import type { Metadata } from "next";

import VerifyClient from "./verify-client";

export const metadata: Metadata = {
  title: "Confirming your payment | InsureHub",
  description: "We are waiting for the payment gateway to confirm your premium.",
  robots: { index: false },
  openGraph: {
    title: "Confirming your payment | InsureHub",
    description: "Payment verification for your InsureHub policy.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const { quoteId } = await params;
  return <VerifyClient quoteId={quoteId} />;
}
