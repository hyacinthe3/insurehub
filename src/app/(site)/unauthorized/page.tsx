import Link from "next/link";
import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";

import { AuthShell, StatusNote } from "@/components/auth/auth-ui";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Access denied (403) — InsureHub",
  description:
    "You don't have permission to view this InsureHub page. Request access from an administrator.",
  robots: { index: false },
  openGraph: {
    title: "Access denied (403) — InsureHub",
    description: "This InsureHub area requires elevated permissions.",
  },
};

export default function UnauthorizedPage() {
  return (
    <AuthShell
      eyebrow="Error 403"
      title="You don't have access to this page"
      subtitle="Your account is signed in, but this area needs different permissions."
    >
      <div className="grid place-items-center gap-4 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-7 w-7" />
        </span>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Partner dashboards, pricing tools and claims administration are limited to verified
          insurer and broker roles.
        </p>
      </div>

      <div className="mt-5">
        <StatusNote tone="error">
          If you believe this is a mistake, ask your workspace administrator to grant the required
          role, or contact support with reference <strong>403-AUTH</strong>.
        </StatusNote>
      </div>

      <div className="mt-6 space-y-3">
        <Button asChild className="w-full">
          <Link href="/">Back to home</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/auth/login">Sign in with another account</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
