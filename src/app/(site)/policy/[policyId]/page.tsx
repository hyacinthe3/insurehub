import type { Metadata } from "next";

import PolicyClient from "./policy-client";

export const metadata: Metadata = {
  title: "Policy confirmed | InsureHub",
  description: "Your policy is active. Download your digital certificate.",
  robots: { index: false },
  openGraph: {
    title: "Policy confirmed | InsureHub",
    description: "Your InsureHub policy certificate and schedule.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ policyId: string }>;
}) {
  const { policyId } = await params;
  return <PolicyClient policyId={policyId} />;
}
