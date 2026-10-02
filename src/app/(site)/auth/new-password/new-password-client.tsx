"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { AuthLink, AuthShell, PasswordField, StatusNote } from "@/components/auth/auth-ui";
import { Button } from "@/components/ui/button";
import { setPasswordWithToken } from "@/lib/api";

/**
 * Password setup screen behind the emailed invitation link
 * (/auth/new-password?token=…). After saving, the pending session continues
 * straight into two-step verification setup.
 */
export default function NewPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("This invitation link is invalid. Ask for a new invitation.");
      return;
    }
    if (password.length < 8 || password.length > 128) {
      setError("Password must be between 8 and 128 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setLoading(true);
    setPasswordWithToken({ token, password })
      .then(() => {
        // The backend issued a pending session — continue to MFA enrolment.
        router.replace("/auth/mfa-setup");
        router.refresh();
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not set your password. Try again.");
        setLoading(false);
      });
  }

  return (
    <AuthShell
      title="Create your password"
      subtitle="Choose a strong password to finish activating your account."
      footer={
        <>
          Just confirming who you are. <AuthLink to="/auth/login">Back to sign in</AuthLink>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit} noValidate>
        {error && <StatusNote tone="error">{error}</StatusNote>}
        <PasswordField
          id="password"
          label="New password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        <PasswordField
          id="confirm"
          label="Confirm new password"
          value={confirm}
          onChange={setConfirm}
          error={error ?? undefined}
          autoComplete="new-password"
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Updating…" : "Update password"}
        </Button>
      </form>
    </AuthShell>
  );
}
