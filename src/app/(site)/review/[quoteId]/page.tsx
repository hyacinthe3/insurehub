import type { Metadata } from "next";

import ReviewClient from "./review-client";

export const metadata: Metadata = {
  title: "Review your quote | InsureHub",
  description: "Check your calculated premium, then accept it or save it for later.",
  robots: { index: false },
  openGraph: {
    title: "Review your quote | InsureHub",
    description: "Your calculated insurance premium and cover summary.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const { quoteId } = await params;
  return <ReviewClient quoteId={quoteId} />;
}
