import type { Metadata } from "next";

import VerifyEmailClient from "./verify-email-client";

export const metadata: Metadata = {
  title: "Verify your email | InsureHub",
  description: "Confirm your email address to finish creating your InsureHub account.",
  robots: { index: false },
};

export default function VerifyEmailPage() {
  return <VerifyEmailClient />;
}
