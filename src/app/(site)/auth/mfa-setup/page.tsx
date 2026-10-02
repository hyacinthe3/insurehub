import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { dashboardFor } from "@/lib/rbac";
import { getServerSession } from "@/lib/server-session";

import MfaSetupClient from "./mfa-setup-client";

export const metadata: Metadata = {
  title: "Set up two-step verification | InsureHub",
  description: "Scan the QR code with your authenticator app to secure your InsureHub account.",
  robots: { index: false },
};

export default async function MfaSetupPage() {
  // Enrolment requires a live session; users who already finished MFA have
  // nothing to set up and go straight to their workspace.
  const session = await getServerSession();
  if (!session.authenticated) redirect("/auth/register");
  if (!session.mfaPending) redirect(dashboardFor(session.user?.role));

  return <MfaSetupClient />;
}
