import type { Metadata } from "next";

import ForgotPasswordClient from "./forgot-password-client";

export const metadata: Metadata = {
  title: "Reset your password | InsureHub",
  description: "Request a password reset link for your InsureHub account.",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
