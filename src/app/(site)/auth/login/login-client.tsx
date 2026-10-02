"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import {
  AuthLink,
  AuthShell,
  Field,
  OrDivider,
  PasswordField,
  StatusNote,
} from "@/components/auth/auth-ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginWithPassword } from "@/lib/api";
import { dashboardFor } from "@/lib/rbac";

export default function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) next.email = "Enter a valid email address.";
    if (password.length < 8) next.password = "Password must be at least 8 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      // Password check first. The backend returns whether the account requires
      // its second factor: if MFA is enabled we go to the TOTP challenge, and if
      // the user has switched it off we land straight on their dashboard.
      const result = await loginWithPassword({ email: email.trim(), password, remember });
      router.replace(result.mfaRequired ? "/auth/mfa" : dashboardFor(result.user.role));
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : "Could not sign you in. Try again.",
      });
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Sign in to InsureHub"
      subtitle="Access your quotes, policies and claims in one secure place."
      footer={
        <>
          New to InsureHub? <AuthLink to="/auth/welcome">Create an account</AuthLink>
        </>
      }
    >
      <OrDivider />

      <form className="space-y-4" onSubmit={submit} noValidate>
        {errors.form && <StatusNote tone="error">{errors.form}</StatusNote>}

        <Field id="email" label="Work or personal email" error={errors.email}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            aria-invalid={Boolean(errors.email)}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <PasswordField
          id="password"
          value={password}
          onChange={setPassword}
          error={errors.password}
        />

        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={remember}
              onCheckedChange={(v) => setRemember(Boolean(v))}
            />
            <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
              Remember me for 30 days
            </Label>
          </div>
          <AuthLink to="/auth/forgot-password">Forgot password?</AuthLink>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Verifying…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
