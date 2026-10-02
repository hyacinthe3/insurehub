import type { Metadata } from "next";

import VerifyPhoneClient from "./verify-phone-client";

export const metadata: Metadata = {
  title: "Verify your phone | InsureHub",
  description: "Confirm your phone number with a one-time code to finish setting up InsureHub.",
  robots: { index: false },
};

export default function VerifyPhonePage() {
  return <VerifyPhoneClient />;
}
