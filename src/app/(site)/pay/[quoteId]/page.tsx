import type { Metadata } from "next";

import PayClient from "./pay-client";

export const metadata: Metadata = {
  title: "Pay for your policy | InsureHub",
  description: "Pay your first premium by mobile money or card to activate cover.",
  robots: { index: false },
  openGraph: {
    title: "Pay for your policy | InsureHub",
    description: "Secure payment for your InsureHub policy.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default async function PayPage({
  params,
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const { quoteId } = await params;
  return <PayClient quoteId={quoteId} />;
}
