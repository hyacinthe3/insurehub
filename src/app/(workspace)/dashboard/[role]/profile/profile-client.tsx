"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { KeyRound, Loader2, Pencil, ShieldCheck, UserRound } from "lucide-react";

import { changePassword, setMfaEnabled, updateProfile, type AccountUser } from "@/lib/api";
import { PageHeader, SectionCard } from "@/components/dashboard/ui-bits";
import { roleProfiles } from "@/lib/rbac";
import { phoneError } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-xl border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
      {message}
    </p>
  );
}

export default function ProfileClient({ initialUser }: { initialUser: AccountUser }) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);

  /* ----------------------------- Edit details ----------------------------- */
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: user.fullName ?? "",
    companyName: user.companyName ?? "",
    phone: user.phone ?? "",
    tin: user.tin ?? "",
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  // Live format feedback for the phone field while typing.
  const [editPhoneError, setEditPhoneError] = useState<string | null>(null);

  function updateEditPhone(value: string) {
    setEditForm((f) => ({ ...f, phone: value }));
    setEditPhoneError(value.trim() ? phoneError(value) : null);
  }

  function openEdit() {
    setEditForm({
      fullName: user.fullName ?? "",
      companyName: user.companyName ?? "",
      phone: user.phone ?? "",
      tin: user.tin ?? "",
    });
    setEditError(null);
    setEditPhoneError(null);
    setEditOpen(true);
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (editSaving) return;

    const isIndividual = user.accountType === "individual";
    const name = editForm.fullName.trim();
    const company = editForm.companyName.trim();
    const phone = editForm.phone.trim();
    const tin = editForm.tin.trim();

    if (isIndividual && !name) return setEditError("Full legal name is required.");
    if (!isIndividual && !company) return setEditError("Registered company name is required.");
    if (!isIndividual && !tin) return setEditError("Tax identification number (TIN) is required.");
    const phoneMessage = phoneError(phone);
    if (phoneMessage) return setEditError(phoneMessage);

    setEditSaving(true);
    setEditError(null);
    try {
      const { user: updated } = await updateProfile({
        fullName: isIndividual ? name : undefined,
        companyName: isIndividual ? undefined : company,
        phone,
        tin: isIndividual ? undefined : tin,
      });
      setUser(updated);
      setEditOpen(false);
      // Keep the navbar name in sync with the saved profile.
      router.refresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Could not save your details. Try again.");
    } finally {
      setEditSaving(false);
    }
  }

  /* ---------------------------- Change password --------------------------- */
  const [securityOpen, setSecurityOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaving, setPwSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  /* ---------------------------- MFA 2-step toggle -------------------------- */
  const [mfaSaving, setMfaSaving] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);

  async function toggleMfa(enabled: boolean) {
    if (mfaSaving) return;
    setMfaSaving(true);
    setMfaError(null);
    try {
      const { user: updated } = await setMfaEnabled(enabled);
      setUser(updated);
    } catch (err) {
      setMfaError(
        err instanceof Error
          ? err.message
          : "Could not update two-step verification. Try again.",
      );
    } finally {
      setMfaSaving(false);
    }
  }

  function openSecurity() {
    setPwForm({ current: "", next: "", confirm: "" });
    setPwError(null);
    setSecurityOpen(true);
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwSaving) return;

    if (!pwForm.current) return setPwError("Enter your current password.");
    if (pwForm.next.length < 8 || pwForm.next.length > 128) {
      return setPwError("New password must be between 8 and 128 characters.");
    }
    if (pwForm.next === pwForm.current) {
      return setPwError("The new password must be different from the current one.");
    }
    if (pwForm.next !== pwForm.confirm) {
      return setPwError("New password and confirmation do not match.");
    }

    setPwSaving(true);
    setPwError(null);
    try {
      await changePassword({ currentPassword: pwForm.current, newPassword: pwForm.next });
      // The backend has revoked every session — sign out immediately.
      setSecurityOpen(false);
      setSigningOut(true);
      setTimeout(() => {
        router.replace("/auth/login");
        router.refresh();
      }, 900);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Could not change your password. Try again.");
      setPwSaving(false);
    }
  }

  const isIndividual = user.accountType === "individual";
  const accountTypeLabel =
    roleProfiles[user.accountType as keyof typeof roleProfiles]?.label ?? user.accountType;
  const displayName = user.fullName?.trim() || user.companyName?.trim() || accountTypeLabel;

  return (
    <section className="px-5 py-8 lg:px-8 lg:py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <PageHeader
          eyebrow={accountTypeLabel}
          title="Profile"
          description="Your details, security and sign-in information."
          icon={UserRound}
        />

        {signingOut && (
          <div className="surface flex items-center gap-3 border-success/30 bg-success/10 p-4 text-sm font-medium text-success">
            <Loader2 className="h-4 w-4 animate-spin" />
            Password changed successfully. Signing you out…
          </div>
        )}

        <SectionCard
          title="Personal details"
          description="This information is attached to your quotes and policies."
          action={
            <Button variant="outline" size="sm" onClick={openEdit} disabled={signingOut}>
              <Pencil />
              Edit Details
            </Button>
          }
        >
          <div className="divide-y divide-border">
            <InfoRow label={isIndividual ? "Full name" : "Company name"} value={displayName} />
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Phone" value={user.phone ?? "—"} />
            {!isIndividual && <InfoRow label="TIN" value={user.tin ?? "—"} />}
            <InfoRow label="Account type" value={accountTypeLabel} />
          </div>
        </SectionCard>

        <SectionCard
          title="Security"
          description="Changing your password signs you out on all devices."
          action={
            <Button variant="outline" size="sm" onClick={openSecurity} disabled={signingOut}>
              <KeyRound />
              Manage Security
            </Button>
          }
        >
          <div className="divide-y divide-border">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
              <div className="min-w-0">
                <p className="text-sm font-medium">Two-step verification (MFA)</p>
                <p className="text-xs text-muted-foreground">
                  {user.mfaEnabled
                    ? "Require a code from your authenticator app when you sign in."
                    : "Sign in with just your password. You can turn this back on any time."}
                </p>
              </div>
              <Switch
                checked={user.mfaSettingEnabled}
                onCheckedChange={toggleMfa}
                disabled={mfaSaving}
                aria-label="Toggle two-step verification"
              />
            </div>
            {mfaError && (
              <p className="px-5 py-2 text-xs font-medium text-destructive">{mfaError}</p>
            )}
            <InfoRow label="Sessions" value="Signing out everywhere on password change" />
          </div>
        </SectionCard>

        {/* ------------------------- Edit details modal ------------------------ */}
        <Dialog open={editOpen} onOpenChange={(open) => !editSaving && setEditOpen(open)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit details</DialogTitle>
              <DialogDescription>
                Update your {isIndividual ? "personal" : "company"} information. Changes are saved
                to your account immediately.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submitEdit} className="space-y-4">
              {isIndividual ? (
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full legal name</Label>
                  <Input
                    id="fullName"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
                    maxLength={120}
                    required
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="companyName">Registered company name</Label>
                    <Input
                      id="companyName"
                      value={editForm.companyName}
                      onChange={(e) => setEditForm((f) => ({ ...f, companyName: e.target.value }))}
                      maxLength={120}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tin">Tax identification number (TIN)</Label>
                    <Input
                      id="tin"
                      value={editForm.tin}
                      onChange={(e) => setEditForm((f) => ({ ...f, tin: e.target.value }))}
                      maxLength={40}
                      required
                    />
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  value={editForm.phone}
                  onChange={(e) => updateEditPhone(e.target.value)}
                  placeholder="+250 788 000 000"
                  aria-invalid={Boolean(editPhoneError)}
                  className={cn(editPhoneError && "border-destructive focus-visible:ring-destructive")}
                  required
                />
                {editPhoneError && (
                  <p className="text-xs font-medium text-destructive">{editPhoneError}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={user.email} disabled />
                <p className="text-xs text-muted-foreground">
                  Your email cannot be changed. Contact support for help.
                </p>
              </div>

              <FormError message={editError} />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                  disabled={editSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={editSaving}>
                  {editSaving && <Loader2 className="animate-spin" />}
                  Save changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ----------------------- Change password modal ----------------------- */}
        <Dialog open={securityOpen} onOpenChange={(open) => !pwSaving && setSecurityOpen(open)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Change password</DialogTitle>
              <DialogDescription>
                Verify your current password, then choose a new one. You will be signed out on all
                devices and must log in again.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submitPassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={pwForm.current}
                  onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={pwForm.next}
                  onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
                  minLength={8}
                  maxLength={128}
                  required
                />
                <p className="text-xs text-muted-foreground">Between 8 and 128 characters.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                  minLength={8}
                  maxLength={128}
                  required
                />
              </div>

              <FormError message={pwError} />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSecurityOpen(false)}
                  disabled={pwSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={pwSaving}>
                  {pwSaving ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                  Update password
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
