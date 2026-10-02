"use client";

import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AuthLink, AuthShell, OtpInput, StatusNote } from "@/components/auth/auth-ui";
import { Button } from "@/components/ui/button";
import { getMfaSetup, getSessionState, verifyMfaCode, type MfaSetup } from "@/lib/api";
import { dashboardFor } from "@/lib/rbac";

export default function MfaSetupClient() {
  const router = useRouter();
  const [setup, setSetup] = useState<MfaSetup | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the TOTP secret + QR code for this enrolment session.
  useEffect(() => {
    let cancelled = false;
    getMfaSetup()
      .then((data) => {
        if (!cancelled) setSetup(data);
      })
      .catch((err) => {
        if (cancelled) return;
        // 401: no pending session — start over. 409: MFA already active.
        setError(err instanceof Error ? err.message : "Could not load your setup code.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (code.length !== 6) {
        setError("Enter the 6-digit code from your authenticator app.");
        return;
      }
      setError(null);
      setLoading(true);
      try {
        await verifyMfaCode(code);
        // MFA confirmed server-side; the session cookie is now fully
        // privileged. Send the user to their dashboard.
        const state = await getSessionState();
        router.replace(dashboardFor(state.user?.role ?? "customer"));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Verification failed. Try again.");
        setCode("");
        setLoading(false);
      }
    },
    [code, router],
  );

  function copySecret() {
    if (!setup) return;
    void navigator.clipboard?.writeText(setup.secret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <AuthShell
      eyebrow="Almost there"
      title="Set up two-step verification"
      subtitle="Scan the QR code with Google Authenticator or Microsoft Authenticator, then enter the 6-digit code it shows."
      footer={
        <>
          Prefer to sign in instead? <AuthLink to="/auth/login">Back to sign in</AuthLink>
        </>
      }
    >
      {!setup && !error && (
        <div className="flex items-center justify-center gap-3 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Generating your secure code…
        </div>
      )}

      {setup && (
        <>
          <ol className="mb-5 space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="font-semibold text-foreground">1.</span>
              Open your authenticator app and scan this code.
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-foreground">2.</span>
              Enter the 6-digit code it displays to finish setup.
            </li>
          </ol>

          <div className="flex flex-col items-center gap-3 rounded-2xl border border-input bg-card p-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={setup.qrDataUrl}
              alt="QR code to add InsureHub to your authenticator app"
              className="h-[232px] w-[232px] rounded-xl bg-white p-2"
            />
            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              Can&apos;t scan? Enter this key manually in your app:
            </p>
            <button
              type="button"
              onClick={copySecret}
              className="group flex items-center gap-2 rounded-lg border border-input bg-muted px-3 py-1.5 font-mono text-xs font-semibold tracking-wider transition-colors hover:bg-accent"
              aria-label="Copy the setup key"
            >
              <span className="max-w-[220px] truncate">{setup.secret}</span>
              {copied ? (
                <Check className="h-3.5 w-3.5 text-success" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
              )}
            </button>
          </div>

          <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
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
              {loading ? "Verifying…" : "Verify & finish setup"}
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <Smartphone className="h-3.5 w-3.5" />
              Codes refresh every 30 seconds — use the current one.
            </p>
          </form>
        </>
      )}

      {!setup && error && (
        <div className="space-y-4">
          <StatusNote tone="error">{error}</StatusNote>
          <Button asChild variant="outline" className="w-full">
            <AuthLink to="/auth/register">Start registration again</AuthLink>
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
