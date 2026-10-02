import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";

import { AuthShell, StatusNote } from "@/components/auth/auth-ui";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Account verified — InsureHub",
  description: "Your InsureHub account is verified. Start comparing and managing policies.",
  openGraph: {
    title: "Account verified — InsureHub",
    description: "Your InsureHub account is verified and ready to use.",
  },
};

export default function VerifiedPage() {
  return (
    <AuthShell
      title="You're verified"
      subtitle="Your identity checks are complete and your InsureHub account is active."
    >
      <div className="grid place-items-center gap-4 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-success/20 text-success animate-in zoom-in duration-500">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Email confirmed, phone confirmed and two-factor authentication enabled.
        </p>
      </div>

      <div className="mt-5">
        <StatusNote tone="warning">
          Insurance company and broker accounts stay in read-only mode until an administrator
          completes compliance verification.
        </StatusNote>
      </div>

      <div className="mt-6 space-y-3">
        <Button asChild className="w-full">
          <Link href="/browse">Start comparing cover</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
