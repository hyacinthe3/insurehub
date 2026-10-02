"use client";

import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { AuthLink, AuthShell, OtpInput, StatusNote } from "@/components/auth/auth-ui";
import { Button } from "@/components/ui/button";
import { getSessionState, verifyMfaCode } from "@/lib/api";
import { dashboardFor } from "@/lib/rbac";

export default function MfaClient() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // Server-side TOTP check upgrades the pending session to a fully
      // authenticated one before we send the user anywhere.
      await verifyMfaCode(code);
      const state = await getSessionState();
      router.replace(dashboardFor(state.user?.role ?? "customer"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed. Try again.");
      setCode("");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Two-step verification"
      subtitle="Enter the current 6-digit code from your authenticator app to finish signing in."
      footer={
        <>
          Trouble signing in? <AuthLink to="/auth/forgot-password">Reset your password</AuthLink>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit} noValidate>
        {error && <StatusNote tone="error">{error}</StatusNote>}
        <OtpInput
          length={6}
          value={code}
          onChange={(v) => {
            setCode(v);
            if (v.length === 6) setError(null);
          }}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {loading ? "Verifying…" : "Verify & continue"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Codes refresh every 30 seconds — use the one currently shown in your app.
        </p>
      </form>
    </AuthShell>
  );
}
