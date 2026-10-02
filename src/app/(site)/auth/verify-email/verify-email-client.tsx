"use client";

import { Mail } from "lucide-react";
import { useState } from "react";

import { AuthLink, AuthShell, StatusNote } from "@/components/auth/auth-ui";
import { Button } from "@/components/ui/button";

export default function VerifyEmailClient() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const resend = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 900);
  };

  return (
    <AuthShell
      title="Check your inbox"
      subtitle="We sent a verification link to the email you registered with. Click it to activate your account."
      footer={
        <>
          Changed your mind? <AuthLink to="/auth/welcome">Start over</AuthLink>
        </>
      }
    >
      <div className="space-y-4">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>

        {sent && (
          <StatusNote tone="success">A fresh verification link is on its way. Check spam too.</StatusNote>
        )}

        <Button type="button" variant="outline" className="w-full" onClick={resend} disabled={sending}>
          {sending ? "Sending…" : "Resend verification link"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          The link expires in 24 hours. Already verified? <AuthLink to="/auth/login">Sign in</AuthLink>
        </p>
      </div>
    </AuthShell>
  );
}
