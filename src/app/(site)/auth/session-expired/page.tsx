import Link from "next/link";
import type { Metadata } from "next";
import { TimerOff } from "lucide-react";

import { AuthShell, StatusNote } from "@/components/auth/auth-ui";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Session expired — InsureHub",
  description: "Your InsureHub session timed out for security. Sign in again to continue.",
  openGraph: {
    title: "Session expired — InsureHub",
    description: "Your secure InsureHub session timed out. Sign in again to continue.",
  },
};

export default function SessionExpiredPage() {
  return (
    <AuthShell
      title="Your session expired"
      subtitle="For your protection we ended the session after a period of inactivity."
    >
      <div className="grid place-items-center gap-4 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-warning/20 text-foreground">
          <TimerOff className="h-7 w-7" />
        </span>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Any quote in progress has been saved as a draft — you'll find it waiting after you sign in.
        </p>
      </div>

      <div className="mt-5">
        <StatusNote>
          Sessions end after 30 minutes idle, or 12 hours in total for privileged partner accounts.
        </StatusNote>
      </div>

      <div className="mt-6 space-y-3">
        <Button asChild className="w-full">
          <Link href="/auth/login">Sign in again</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/">Return to home</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
