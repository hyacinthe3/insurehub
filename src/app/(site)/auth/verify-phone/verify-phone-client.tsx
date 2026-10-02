"use client";

import { useRouter } from "next/navigation";
import { Phone } from "lucide-react";
import { useState } from "react";

import { AuthLink, AuthShell, OtpInput, StatusNote } from "@/components/auth/auth-ui";
import { Button } from "@/components/ui/button";

export default function VerifyPhoneClient() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Enter the 6-digit code we texted you.");
      return;
    }
    setError(null);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push("/auth/verified");
    }, 900);
  }

  return (
    <AuthShell
      title="Verify your phone"
      subtitle="Enter the 6-digit code we sent to your mobile number."
      footer={
        <>
          Changed your number? <AuthLink to="/auth/register">Update your details</AuthLink>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit} noValidate>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10">
          <Phone className="h-6 w-6 text-primary" />
        </div>

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
          {loading ? "Verifying…" : "Verify phone"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Didn't get the text? Resend the code — it's valid for 5 minutes.
        </p>
      </form>
    </AuthShell>
  );
}
