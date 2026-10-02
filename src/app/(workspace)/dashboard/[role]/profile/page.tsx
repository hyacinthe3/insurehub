import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { isRole } from "@/lib/rbac";
import { getServerSession } from "@/lib/server-session";

import ProfileClient from "./profile-client";

export const metadata: Metadata = {
  title: "Profile — InsureHub",
  robots: { index: false },
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  if (!isRole(role)) notFound();

  // Same server-side gate as the dashboard layout.
  const session = await getServerSession();
  if (!session.authenticated) redirect("/auth/login");
  if (session.mfaPending || !session.user) redirect("/auth/mfa");
  if (session.user.role !== role) redirect(`/dashboard/${session.user.role}`);

  return <ProfileClient initialUser={session.user} />;
}
