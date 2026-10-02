"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Loader2,
  Mail,
  MapPin,
  MoreVertical,
  Phone,
  Power,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Star,
  User2,
  X,
  XCircle,
} from "lucide-react";

import {
  approveApplication,
  getAdminCompanies,
  getCompanyApplications,
  rejectApplication,
  setCompanyStatus,
  type AdminCompany,
  type CompanyApplication,
  type CompanyApplicationStatus,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

const fmtDateShort = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

/* ------------------------------------------------------------------ */
/* Status pill (for registration applications)                         */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: CompanyApplicationStatus }) {
  const config = {
    pending: {
      label: "Pending Review",
      icon: Clock,
      cls: "bg-warning/12 text-warning-foreground border-warning/30",
    },
    approved: {
      label: "Approved",
      icon: ShieldCheck,
      cls: "bg-success/12 text-success border-success/25",
    },
    rejected: {
      label: "Rejected",
      icon: ShieldX,
      cls: "bg-destructive/10 text-destructive border-destructive/25",
    },
  }[status];

  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        config.cls,
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Reject dialog                                                        */
/* ------------------------------------------------------------------ */

function RejectDialog({
  companyName,
  onConfirm,
  onCancel,
  loading,
}: {
  companyName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="surface relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-200 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldX className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-semibold">Reject Application</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              You&apos;re rejecting <strong>{companyName}</strong>. This action can be reviewed
              later.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-full border border-input text-muted-foreground transition-colors hover:bg-accent"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="reject-reason">
            Rejection reason <span className="text-destructive">*</span>
          </label>
          <textarea
            id="reject-reason"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe why this application is being rejected…"
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-destructive/30 resize-none"
          />
          <p className="mt-1 text-xs text-muted-foreground">{reason.trim().length}/0 chars minimum required</p>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 rounded-full border border-input py-2 text-sm font-semibold transition-colors hover:bg-accent"
          >
            Cancel
          </button>
          <button
            disabled={reason.trim().length < 10 || loading}
            onClick={() => onConfirm(reason.trim())}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-destructive py-2 text-sm font-semibold text-destructive-foreground transition-opacity disabled:opacity-50"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Reject Application
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Row model for the unified table: a company OR an application        */
/* ------------------------------------------------------------------ */

type ListedCompany =
  | { kind: "company"; data: AdminCompany }
  | { kind: "application"; data: CompanyApplication };

/* ------------------------------------------------------------------ */
/* Centered detail dialog (company or application)                     */
/* ------------------------------------------------------------------ */

function DetailDialog({
  target,
  open,
  onOpenChange,
  onApprove,
  onReject,
  actionLoading,
}: {
  target: ListedCompany | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  actionLoading: string | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden p-0 gap-0 sm:rounded-2xl">
        {target?.kind === "company" ? (
          <CompanyDetails company={target.data} />
        ) : target ? (
          <ApplicationDetails
            app={target.data}
            onApprove={onApprove}
            onReject={onReject}
            actionLoading={actionLoading}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CompanyDetails({ company }: { company: AdminCompany }) {
  return (
    <>
      {/* Hero header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 px-8 py-7 text-primary-foreground">
        <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 right-16 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
            <Building2 className="h-8 w-8" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
              Registered Company
            </p>
            <h2 className="truncate text-2xl font-bold text-primary-foreground">{company.name}</h2>
            {company.tagline && (
              <p className="mt-0.5 line-clamp-2 text-sm text-primary-foreground/80">
                {company.tagline}
              </p>
            )}
          </div>
        </div>
        <div className="relative mt-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
            <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
            {company.rating.toFixed(1)} rating
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
            {company.branches} branch{company.branches !== 1 ? "es" : ""}
          </span>
        </div>
      </div>

      <DialogDescription className="sr-only">Details for {company.name}</DialogDescription>

      {/* Body */}
      <div className="max-h-[60vh] overflow-y-auto px-8 py-6">
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
          {[
            { icon: Shield, label: "License", value: company.license },
            { icon: MapPin, label: "Headquarters", value: company.headquarters },
            { icon: FileText, label: "Products", value: String(company.productCount) },
            { icon: ShieldCheck, label: "Policies", value: String(company.policyCount) },
            { icon: Clock, label: "Claims paid", value: company.claimsPaidRate },
            { icon: Mail, label: "Company slug", value: company.slug },
          ]
            .filter((f) => f.value)
            .map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="mt-0.5 break-words text-sm font-semibold text-foreground">
                    {value}
                  </dd>
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}

function ApplicationDetails({
  app,
  onApprove,
  onReject,
  actionLoading,
}: {
  app: CompanyApplication;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  actionLoading: string | null;
}) {
  const isLoading = actionLoading === app.id;

  return (
    <>
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-border px-8 py-5">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-brand">
          <Building2 className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Insurance Application
          </p>
          <h2 className="truncate text-lg font-bold">{app.companyName}</h2>
          <div className="mt-1">
            <StatusBadge status={app.status} />
          </div>
        </div>
      </div>

      <DialogDescription className="sr-only">
        Application for {app.companyName}
      </DialogDescription>

      {/* Body */}
      <div className="max-h-[60vh] overflow-y-auto px-8 py-6 space-y-5">
        {/* Contact info */}
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Company Information
          </h3>
          <dl className="space-y-2.5">
            {[
              { icon: Mail, label: "Email", value: app.email },
              { icon: Phone, label: "Phone", value: app.phone },
              { icon: MapPin, label: "Headquarters", value: app.headquarters },
              { icon: Shield, label: "License", value: app.license },
              { icon: Calendar, label: "Founded", value: app.founded ? String(app.founded) : null },
            ]
              .filter((f) => f.value)
              .map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="text-sm font-medium">{value}</dd>
                  </div>
                </div>
              ))}
            {app.tin && (
              <div className="flex items-start gap-2.5">
                <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">TIN</dt>
                  <dd className="text-sm font-medium font-mono">{app.tin}</dd>
                </div>
              </div>
            )}
          </dl>
        </section>

        {app.tagline && (
          <section>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tagline
            </h3>
            <p className="text-sm italic text-muted-foreground">&ldquo;{app.tagline}&rdquo;</p>
          </section>
        )}

        {app.about && (
          <section>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              About
            </h3>
            <p className="text-sm leading-relaxed text-foreground/80">{app.about}</p>
          </section>
        )}

        {/* Documents */}
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Submitted Documents
          </h3>
          {app.documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents submitted.</p>
          ) : (
            <ul className="space-y-1.5">
              {app.documents.map((doc, i) => (
                <li key={i}>
                  <a
                    href={doc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm font-medium transition-colors hover:bg-accent group"
                  >
                    <FileText className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                    <span className="flex-1 truncate">
                      {doc.split("/").pop() || `Document ${i + 1}`}
                    </span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Review info — shown for reviewed apps */}
        {app.status !== "pending" && (
          <section
            className={cn(
              "rounded-xl border p-4 space-y-2",
              app.status === "approved"
                ? "border-success/25 bg-success/6"
                : "border-destructive/25 bg-destructive/6",
            )}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Review Decision
            </h3>
            {app.reviewedAt && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{fmtDate(app.reviewedAt)}</span>
              </div>
            )}
            {app.reviewerName && (
              <div className="flex items-center gap-2 text-sm">
                <User2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  By <strong>{app.reviewerName}</strong>
                </span>
              </div>
            )}
            {app.rejectionReason && (
              <div className="mt-2 rounded-lg bg-destructive/8 border border-destructive/20 px-3 py-2">
                <p className="text-xs font-semibold text-destructive mb-1">Rejection Reason</p>
                <p className="text-sm text-destructive/90">{app.rejectionReason}</p>
              </div>
            )}
          </section>
        )}

        {/* Timestamps */}
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Timeline
          </h3>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Submitted</span>
              <span className="font-medium">{fmtDateShort(app.createdAt)}</span>
            </div>
            {app.reviewedAt && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reviewed</span>
                <span className="font-medium">{fmtDateShort(app.reviewedAt)}</span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Footer actions — only for pending */}
      {app.status === "pending" && (
        <div className="border-t border-border px-8 py-4 flex gap-3">
          <button
            disabled={isLoading}
            onClick={() => onReject(app.id)}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-destructive/40 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/8 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            Reject
          </button>
          <button
            disabled={isLoading}
            onClick={() => onApprove(app.id)}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-success py-2.5 text-sm font-semibold text-success-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Approve
          </button>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Deactivate confirmation (centered dialog)                           */
/* ------------------------------------------------------------------ */

function DeactivateDialog({
  company,
  open,
  onOpenChange,
  onConfirm,
  deactivating,
}: {
  company: AdminCompany | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  deactivating: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:rounded-2xl">
        <DialogHeader className="sm:text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <Power className="h-7 w-7" />
          </span>
          <DialogTitle className="pt-3 text-xl">Deactivate {company?.name}?</DialogTitle>
          <DialogDescription className="mx-auto max-w-sm text-center">
            This will suspend the company&apos;s account on the platform. Products and policies
            will no longer be available until the company is reactivated.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center sm:space-x-3 sm:pt-2">
          <button
            onClick={() => onOpenChange(false)}
            disabled={deactivating}
            className="rounded-full border border-input px-5 py-2 text-sm font-semibold transition-colors hover:bg-accent disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deactivating}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-destructive px-5 py-2 text-sm font-semibold text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {deactivating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Power className="h-4 w-4" />
            )}
            Deactivate
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Unified companies applications table                                */
/* ------------------------------------------------------------------ */

function CompaniesTable({
  rows,
  onViewDetails,
  onDeactivate,
  onApprove,
  onReject,
  actionLoading,
  showDeactivation,
}: {
  rows: ListedCompany[];
  onViewDetails: (row: ListedCompany) => void;
  onDeactivate: (company: AdminCompany) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  actionLoading: string | null;
  showDeactivation: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40 hover:bg-muted/40">
          <TableHead className="px-4">Company</TableHead>
          <TableHead>Rating</TableHead>
          <TableHead>License</TableHead>
          <TableHead>Headquarters</TableHead>
          <TableHead className="text-center">Products</TableHead>
          <TableHead className="text-center">Policies</TableHead>
          <TableHead>Status</TableHead>
          {showDeactivation && <TableHead>Deactivated</TableHead>}
          <TableHead className="pr-4" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          if (row.kind === "company") {
            const company = row.data;
            const isDeactivated = company.status === "deactivated";
            return (
              <TableRow
                key={`c-${company.slug}`}
                className={cn("group", isDeactivated && "opacity-60")}
              >
                <TableCell className="px-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{company.name}</p>
                      {company.tagline && (
                        <p className="truncate text-xs text-muted-foreground">{company.tagline}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {company.rating.toFixed(1)}
                  </span>
                </TableCell>
                <TableCell className="max-w-[160px]">
                  <span className="truncate">{company.license}</span>
                </TableCell>
                <TableCell className="max-w-[160px]">
                  <span className="truncate">{company.headquarters}</span>
                </TableCell>
                <TableCell className="text-center font-medium">{company.productCount}</TableCell>
                <TableCell className="text-center font-medium">{company.policyCount}</TableCell>
                <TableCell>
                  {isDeactivated ? (
                    <Badge variant="outline" className="border-destructive/30 text-destructive">
                      Deactivated
                    </Badge>
                  ) : (
                    <Badge className="border-transparent bg-success/15 text-success hover:bg-success/15">
                      Active
                    </Badge>
                  )}
                </TableCell>
                {showDeactivation && (
                  <TableCell className="whitespace-nowrap">
                    {company.deactivatedAt ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {fmtDate(company.deactivatedAt)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                )}
                <TableCell className="pr-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        aria-label={`Actions for ${company.name}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="end" className="min-w-[11rem]">
                      <DropdownMenuItem onClick={() => onViewDetails(row)}>
                        <Eye className="h-4 w-4" />
                        View details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDeactivate(company)}
                        className={isDeactivated ? "" : "text-destructive focus:text-destructive"}
                      >
                        <Power className="h-4 w-4" />
                        {isDeactivated ? "Reactivate" : "Deactivate"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          }

          const app = row.data;
          const appLoading = actionLoading === app.id;
          return (
            <TableRow
              key={`a-${app.id}`}
              className={cn("group", app.status === "rejected" && "opacity-70")}
            >
              <TableCell className="px-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-warning/10 text-warning-foreground">
                    <Building2 className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{app.companyName}</p>
                    {app.email && (
                      <p className="truncate text-xs text-muted-foreground">{app.email}</p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground">—</span>
              </TableCell>
              <TableCell className="max-w-[160px]">
                <span className="truncate">{app.license ?? "—"}</span>
              </TableCell>
              <TableCell className="max-w-[160px]">
                <span className="truncate">{app.headquarters ?? "—"}</span>
              </TableCell>
              <TableCell className="text-center text-muted-foreground">—</TableCell>
              <TableCell className="text-center text-muted-foreground">—</TableCell>
              <TableCell>
                <StatusBadge status={app.status} />
              </TableCell>
              {showDeactivation && (
                <TableCell>
                  <span className="text-muted-foreground">—</span>
                </TableCell>
              )}
              <TableCell className="pr-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      aria-label={`Actions for ${app.companyName}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="end" className="min-w-[11rem]">
                    <DropdownMenuItem onClick={() => onViewDetails(row)}>
                      <Eye className="h-4 w-4" />
                      View details
                    </DropdownMenuItem>
                    {app.status === "pending" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={appLoading}
                          className="text-destructive focus:text-destructive"
                          onClick={() => onReject(app.id)}
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={appLoading} onClick={() => onApprove(app.id)}>
                          <CheckCircle2 className="h-4 w-4" />
                          Approve
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

/* ------------------------------------------------------------------ */
/* Filter tabs                                                          */
/* ------------------------------------------------------------------ */

type FilterTab = "all" | CompanyApplicationStatus | "deactivated";

const TABS: { value: FilterTab; label: string; icon: typeof Shield }[] = [
  { value: "all", label: "All", icon: Building2 },
  { value: "pending", label: "Pending", icon: Clock },
  { value: "approved", label: "Approved", icon: ShieldCheck },
  { value: "rejected", label: "Rejected", icon: ShieldAlert },
  { value: "deactivated", label: "Deactivated", icon: Power },
];

/* ------------------------------------------------------------------ */
/* Main component                                                       */
/* ------------------------------------------------------------------ */

export default function AdminCompanies() {
  const [allApps, setAllApps] = useState<CompanyApplication[] | null>(null);
  const [companies, setCompanies] = useState<AdminCompany[] | null>(null);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<FilterTab>("all");
  const [detailTarget, setDetailTarget] = useState<ListedCompany | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminCompany | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<CompanyApplication | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sortDesc, setSortDesc] = useState(true);

  const load = useCallback(() => {
    getCompanyApplications()
      .then((rows) => setAllApps(rows))
      .catch(() => setError(true));
    getAdminCompanies()
      .then(setCompanies)
      .catch(() => setCompanies(null));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = useCallback(
    async (id: string) => {
      setActionLoading(id);
      try {
        const updated = await approveApplication(id);
        setAllApps((prev) => prev?.map((a) => (a.id === id ? updated : a)) ?? null);
        setDetailTarget((prev) =>
          prev?.kind === "application" && prev.data.id === id
            ? { kind: "application", data: updated }
            : prev,
        );
      } catch {
        // silently restore
      } finally {
        setActionLoading(null);
      }
    },
    [],
  );

  const handleReject = useCallback((id: string) => {
    const app = allApps?.find((a) => a.id === id);
    if (app) setRejectTarget(app);
  }, [allApps]);

  const confirmReject = useCallback(
    async (reason: string) => {
      if (!rejectTarget) return;
      const id = rejectTarget.id;
      setActionLoading(id);
      try {
        const updated = await rejectApplication(id, reason);
        setAllApps((prev) => prev?.map((a) => (a.id === id ? updated : a)) ?? null);
        setDetailTarget((prev) =>
          prev?.kind === "application" && prev.data.id === id
            ? { kind: "application", data: updated }
            : prev,
        );
        setRejectTarget(null);
      } catch {
        // silently restore
      } finally {
        setActionLoading(null);
      }
    },
    [rejectTarget],
  );

  const handleDeactivate = useCallback(async () => {
    if (!deactivateTarget) return;
    const target = deactivateTarget;
    const nextActive = target.status !== "deactivated";
    setDeactivating(true);
    try {
      const updated = await setCompanyStatus(target.slug, nextActive);
      setCompanies((prev) => prev?.map((c) => (c.slug === updated.slug ? updated : c)) ?? null);
      setDetailTarget((prev) =>
        prev?.kind === "company" && prev.data.slug === target.slug
          ? { kind: "company", data: updated }
          : prev,
      );
      setDeactivateTarget(null);
    } catch {
      // leave dialog open so the admin can retry
    } finally {
      setDeactivating(false);
    }
  }, [deactivateTarget]);

  if (error) {
    return (
      <div className="surface p-8 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-5 w-5" />
        </span>
        <p className="mt-4 font-semibold">No results found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          No applications match this search.
        </p>
        <button
          onClick={() => {
            setError(false);
            load();
          }}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-brand"
        >
          Try again
        </button>
      </div>
    );
  }

  const counts = {
    all: (allApps?.length ?? 0) + (companies?.length ?? 0),
    pending: allApps?.filter((a) => a.status === "pending").length ?? 0,
    approved:
      (allApps?.filter((a) => a.status === "approved").length ?? 0) + (companies?.length ?? 0),
    rejected: allApps?.filter((a) => a.status === "rejected").length ?? 0,
    deactivated: companies?.filter((c) => c.status === "deactivated").length ?? 0,
  };

  const listed: ListedCompany[] | null = (() => {
    if (allApps === null && companies === null) return null;

    const companyItems: ListedCompany[] =
      companies?.map((c) => ({ kind: "company", data: c })) ?? [];
    const appItems: ListedCompany[] =
      allApps?.map((a) => ({ kind: "application", data: a })) ?? [];

    let combined = [...companyItems, ...appItems];

    // Registered companies show under "All" and "Approved" (they are active on
    // the platform); applications are filtered by their own status. The
    // "Deactivated" tab isolates companies that an admin has suspended.
    if (tab === "approved") {
      combined = [
        ...companyItems,
        ...appItems.filter((i) => i.kind === "application" && i.data.status === "approved"),
      ];
    } else if (tab === "deactivated") {
      combined = companyItems.filter((i) => i.data.status === "deactivated");
    } else if (tab !== "all") {
      combined = combined.filter(
        (i) => i.kind === "application" && i.data.status === (tab as CompanyApplicationStatus),
      );
    }

    return combined.sort((a, b) => {
      const ta = a.kind === "application" ? new Date(a.data.createdAt).getTime() : 0;
      const tb = b.kind === "application" ? new Date(b.data.createdAt).getTime() : 0;
      return sortDesc ? tb - ta : ta - tb;
    });
  })();

  return (
    <>
      {/* Reject dialog */}
      {rejectTarget && (
        <RejectDialog
          companyName={rejectTarget.companyName}
          onConfirm={confirmReject}
          onCancel={() => setRejectTarget(null)}
          loading={actionLoading === rejectTarget.id}
        />
      )}

      {/* Detail dialog (company or application, centered) */}
      <DetailDialog
        target={detailTarget}
        open={detailTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDetailTarget(null);
        }}
        onApprove={handleApprove}
        onReject={handleReject}
        actionLoading={actionLoading}
      />

      {/* Deactivate confirmation */}
      <DeactivateDialog
        company={deactivateTarget}
        open={deactivateTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null);
        }}
        onConfirm={handleDeactivate}
        deactivating={deactivating}
      />

      <div className="space-y-5">
        {/* Summary stat strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Registered Companies", value: companies?.length ?? 0, cls: "text-primary" },
            { label: "Pending Review", value: counts.pending, cls: "text-warning-foreground" },
            { label: "Approved", value: counts.approved, cls: "text-success" },
            { label: "Rejected", value: counts.rejected, cls: "text-destructive" },
          ].map(({ label, value, cls }) => (
            <div key={label} className="surface p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={cn("mt-1 text-2xl font-bold", cls)}>
                {allApps === null && companies === null ? "—" : value}
              </p>
            </div>
          ))}
        </div>

        {/* Main panel */}
        <div className="surface overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="text-base font-semibold">Insurance Company Applications</h2>
              <p className="text-sm text-muted-foreground">
                Registered insurance companies and insurer registration requests
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <button
                onClick={() => setSortDesc((d) => !d)}
                className="flex items-center gap-1 rounded-full border border-input px-3 py-1 text-xs font-semibold transition-colors hover:bg-accent"
              >
                {sortDesc ? (
                  <>
                    <ChevronDown className="h-3 w-3" /> Newest first
                  </>
                ) : (
                  <>
                    <ChevronUp className="h-3 w-3" /> Oldest first
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex overflow-x-auto border-b border-border">
            {TABS.map(({ value, label, icon: Icon }) => {
              const count = counts[value];
              const active = tab === value;
              return (
                <button
                  key={value}
                  onClick={() => setTab(value)}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                  {allApps !== null && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-xs font-semibold",
                        active
                          ? value === "pending"
                            ? "bg-warning/15 text-warning-foreground"
                            : "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Body */}
          <div className="p-5">
            {listed === null ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : listed.length === 0 ? (
              <div className="py-16 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </span>
                <p className="mt-4 font-semibold">Nothing found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tab === "all"
                    ? "There are no registered companies or insurer requests right now."
                    : tab === "deactivated"
                      ? "There are no deactivated insurance companies at the moment."
                      : `No ${tab} applications at this time.`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <CompaniesTable
                  rows={listed}
                  onViewDetails={(row) => setDetailTarget(row)}
                  onDeactivate={(c) => setDeactivateTarget(c)}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  actionLoading={actionLoading}
                  showDeactivation={tab === "deactivated"}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
