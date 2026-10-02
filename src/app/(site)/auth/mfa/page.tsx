import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { dashboardFor } from "@/lib/rbac";
import { getServerSession } from "@/lib/server-session";

import MfaClient from "./mfa-client";

export const metadata: Metadata = {
  title: "Two-step verification | InsureHub",
  description: "Confirm it's you with a one-time code from your authenticator app.",
  robots: { index: false },
};

export default async function MfaPage() {
  // The challenge only makes sense mid-login: no session → sign in first;
  // already-confirmed session → straight to the workspace.
  const session = await getServerSession();
  if (!session.authenticated) redirect("/auth/login");
  if (!session.mfaPending) redirect(dashboardFor(session.user?.role));

  return <MfaClient />;
}
