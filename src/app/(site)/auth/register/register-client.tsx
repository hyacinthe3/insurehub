"use client";

import { useRouter } from "next/navigation";
import { Briefcase, Building2, Loader2, ShieldCheck, User } from "lucide-react";
import { useState } from "react";

import {
  AuthLink,
  AuthShell,
  Field,
  GoogleButton,
  OrDivider,
  PasswordField,
  StatusNote,
} from "@/components/auth/auth-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerAccount } from "@/lib/api";
import { emailError, normalizePhone, phoneError } from "@/lib/validation";
import { cn } from "@/lib/utils";

type AccountType = "individual" | "business" | "insurer" | "broker";

const types: { id: AccountType; label: string; icon: typeof User }[] = [
  { id: "individual", label: "Individual", icon: User },
  { id: "business", label: "Business", icon: Building2 },
  { id: "insurer", label: "Insurance company", icon: ShieldCheck },
  { id: "broker", label: "Broker", icon: Briefcase },
];

const fieldsFor = (type: AccountType): { id: string; label: string; type: string; placeholder: string }[] =>
  type === "individual"
    ? [
        { id: "fullName", label: "Full legal name", type: "text", placeholder: "Jean Mugisha" },
        { id: "email", label: "Email address", type: "email", placeholder: "you@mail.com" },
        { id: "phone", label: "Phone number", type: "tel", placeholder: "078 000 0000" },
      ]
    : [
        { id: "companyName", label: "Registered company name", type: "text", placeholder: "Kivu Logistics Ltd" },
        { id: "email", label: "Work email address", type: "email", placeholder: "hello@company.com" },
        { id: "phone", label: "Business phone", type: "tel", placeholder: "078 000 0000" },
        { id: "tin", label: "Tax identification number (TIN)", type: "text", placeholder: "123456789" },
      ];

export default function RegisterClient() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [form, setForm] = useState<Record<string, string>>({});
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* Live format feedback: email + phone are checked on every keystroke once
     the field has content (emptiness is still only flagged on submit). */
  const liveError = (id: string, value: string): string | null => {
    if (id === "email" && value.trim()) return emailError(value);
    if (id === "phone" && value.trim()) return phoneError(value);
    return null;
  };

  const set = (id: string, value: string) => {
    setForm((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: liveError(id, value) ?? "" }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    for (const f of fieldsFor(accountType)) {
      const value = form[f.id]?.trim() ?? "";
      if (!value) next[f.id] = "This field is required.";
      else {
        const message = liveError(f.id, value);
        if (message) next[f.id] = message;
      }
    }
    if (password.length < 8) next.password = "Password must be at least 8 characters.";
    if (password !== confirm) next.confirm = "Passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      // Persist the account, then continue to MFA enrolment. The backend
      // starts a short-lived MFA-pending session via an httpOnly cookie.
      await registerAccount({
        accountType,
        fullName: form.fullName?.trim() || undefined,
        companyName: form.companyName?.trim() || undefined,
        email: form.email!.trim(),
        phone: normalizePhone(form.phone!) ?? form.phone!.trim(),
        tin: form.tin?.trim() || undefined,
        password,
      });
      router.push("/auth/mfa-setup");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not create your account. Try again.";
      setErrors({ form: message });
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your InsureHub account"
      subtitle="One account for every side of the marketplace — customers, insurers and brokers."
      footer={
        <>
          Already have an account? <AuthLink to="/auth/login">Sign in</AuthLink>
        </>
      }
    >
      <GoogleButton />
      <OrDivider />

      <form className="space-y-4" onSubmit={submit} noValidate>
        {errors.form && <StatusNote tone="error">{errors.form}</StatusNote>}

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Account type</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {types.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setAccountType(t.id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                  accountType === t.id
                    ? "border-primary bg-primary/8 text-primary"
                    : "border-input text-muted-foreground hover:bg-accent",
                )}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {fieldsFor(accountType).map((f) => (
          <Field key={f.id} id={f.id} label={f.label} error={errors[f.id]}>
            <Input
              id={f.id}
              type={f.type}
              autoComplete="off"
              placeholder={f.placeholder}
              value={form[f.id] ?? ""}
              aria-invalid={Boolean(errors[f.id])}
              className={cn(errors[f.id] && "border-destructive focus-visible:ring-destructive")}
              onChange={(e) => set(f.id, e.target.value)}
            />
          </Field>
        ))}

        <PasswordField id="password" value={password} onChange={setPassword} error={errors.password} label="Password" />
        <PasswordField
          id="confirm"
          value={confirm}
          onChange={setConfirm}
          error={errors.confirm}
          label="Confirm password"
          autoComplete="new-password"
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
