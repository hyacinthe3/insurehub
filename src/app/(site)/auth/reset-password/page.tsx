import Link from "next/link";
import type { Metadata } from "next";
import { MailOpen } from "lucide-react";

import { AuthLink, AuthShell, StatusNote } from "@/components/auth/auth-ui";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Reset link sent — InsureHub",
  description: "We've emailed a single-use link to reset your InsureHub password.",
  openGraph: {
    title: "Reset link sent — InsureHub",
    description: "Open the reset link we emailed to choose a new InsureHub password.",
  },
};

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Reset link on its way"
      subtitle="Open the email on this device and follow the link to choose a new password."
      footer={
        <>
          Need another link? <AuthLink to="/auth/forgot-password">Request again</AuthLink>
        </>
      }
    >
      <div className="grid place-items-center gap-4 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-primary-soft text-primary">
          <MailOpen className="h-7 w-7" />
        </span>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The link is valid for 30 minutes. Requesting a new link immediately invalidates the
          previous one.
        </p>
      </div>

      <div className="mt-5">
        <StatusNote tone="warning">
          If you didn't request this, someone may have entered your email by mistake. Your password
          stays unchanged until the link is used.
        </StatusNote>
      </div>

      <div className="mt-6 space-y-3">
        <Button asChild className="w-full">
          <Link href="/auth/new-password">I have the link — continue</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/auth/login">Back to sign in</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
