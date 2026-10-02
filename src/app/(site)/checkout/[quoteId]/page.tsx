import type { Metadata } from "next";

import CheckoutClient from "./checkout-client";

export const metadata: Metadata = {
  title: "Checkout | InsureHub",
  description: "Confirm your details, upload documents and accept the policy terms.",
  robots: { index: false },
  openGraph: {
    title: "Checkout | InsureHub",
    description: "Confirm your details before paying for your InsureHub policy.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const { quoteId } = await params;
  return <CheckoutClient quoteId={quoteId} />;
}
