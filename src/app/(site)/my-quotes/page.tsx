"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  HelpCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  QuoteRequestItem,
  acceptQuoteRequest,
  listMyQuoteRequests,
  respondToQuoteInfoRequest,
} from "@/lib/api";
import { formatRwf } from "@/lib/insurance-data";

export default function MyQuotesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email");
  const [requests, setRequests] = useState<QuoteRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState(emailFromUrl ?? "");
  const [activeEmail, setActiveEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Response drawer state for info requests
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const fetchQuotes = async (email?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listMyQuoteRequests(email);
      setRequests(data);
      if (email) setActiveEmail(email);
    } catch (err: any) {
      setError(err?.message || "Failed to load quote requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes(emailFromUrl ?? undefined);
  }, [emailFromUrl]);

  const handleSearchByEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    fetchQuotes(emailInput.trim().toLowerCase());
  };

  const handleAccept = async (reqItem: QuoteRequestItem) => {
    setAcceptingId(reqItem.id);
    try {
      const { draftId } = await acceptQuoteRequest(reqItem.id, activeEmail || reqItem.customerEmail);
      router.push(`/checkout/${draftId}`);
    } catch (err: any) {
      alert(err?.message || "Failed to accept quote. Please try again.");
      setAcceptingId(null);
    }
  };

  const handleSendReply = async (id: string) => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      await respondToQuoteInfoRequest(id, replyText.trim(), activeEmail);
      setRespondingId(null);
      setReplyText("");
      await fetchQuotes(activeEmail);
    } catch (err: any) {
      alert(err?.message || "Failed to send response.");
    } finally {
      setSubmittingReply(false);
    }
  };

  const statusBadge = (status: QuoteRequestItem["status"]) => {
    switch (status) {
      case "pending_review":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600">
            <Clock className="h-3.5 w-3.5" /> Pending Review
          </span>
        );
      case "info_requested":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-600">
            <HelpCircle className="h-3.5 w-3.5" /> Info Requested
          </span>
        );
      case "quoted":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" /> Quote Ready
          </span>
        );
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Quote Accepted
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-600">
            <XCircle className="h-3.5 w-3.5" /> Declined
          </span>
        );
      case "inspection_required":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-600">
            <ShieldAlert className="h-3.5 w-3.5" /> Inspection Needed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Quote Requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track applications, review official quotes from insurers, and proceed to policy payment.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchQuotes(activeEmail)}
          className="inline-flex items-center gap-2 rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          <RefreshCw className="h-4 w-4" /> Refresh Status
        </button>
      </div>

      {/* Guest / Email Search bar */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <form onSubmit={handleSearchByEmail} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              placeholder="Enter your email to find guest quote requests..."
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full rounded-xl border border-input bg-background pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Find Requests
          </button>
        </form>
        {activeEmail && (
          <p className="mt-2 text-xs text-muted-foreground">
            Showing requests for: <span className="font-semibold text-foreground">{activeEmail}</span>
          </p>
        )}
      </div>

      {loading ? (
        <div className="space-y-4 py-12 text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your quote requests...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-center text-destructive">
          <AlertCircle className="mx-auto h-8 w-8" />
          <p className="mt-2 text-sm font-medium">{error}</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-base font-semibold">No quote requests found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            You haven't submitted any insurance quote requests yet.
          </p>
          <Link
            href="/marketplace"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Explore Marketplace
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold">{req.productName}</h3>
                    {statusBadge(req.status)}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Insurer: <strong className="text-foreground">{req.providerName}</strong> · Category: {req.categoryName}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Submitted on {new Date(req.submittedAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Quoted Premium Action Box */}
                {req.status === "quoted" && req.quotedPremium && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-right">
                    <p className="text-xs font-medium text-emerald-700">Quoted Premium</p>
                    <p className="text-2xl font-bold tracking-tight text-emerald-700">
                      {formatRwf(req.quotedPremium)}/mo
                    </p>
                    <button
                      type="button"
                      disabled={acceptingId === req.id}
                      onClick={() => handleAccept(req)}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {acceptingId === req.id ? "Preparing Checkout…" : "Accept & Pay"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {req.status === "accepted" && req.draftId && (
                  <div className="text-right">
                    <Link
                      href={`/checkout/${req.draftId}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90"
                    >
                      Proceed to Payment
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Insurer Note / Rejection Reason / Info Request Details */}
              {req.quotedNote && (
                <div className="mt-4 rounded-xl border border-border bg-muted/40 p-3 text-sm">
                  <span className="font-semibold text-foreground">Note from insurer: </span>
                  <span className="text-muted-foreground">{req.quotedNote}</span>
                </div>
              )}

              {req.rejectionReason && (
                <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-700">
                  <span className="font-semibold">Declined Reason: </span>
                  {req.rejectionReason}
                </div>
              )}

              {req.inspectionNote && (
                <div className="mt-4 rounded-xl border border-purple-500/20 bg-purple-500/10 p-3 text-sm text-purple-700">
                  <span className="font-semibold">Inspection Details: </span>
                  {req.inspectionNote}
                </div>
              )}

              {req.status === "info_requested" && (
                <div className="mt-4 rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-3">
                  <div className="text-sm text-blue-900">
                    <strong className="font-semibold">Insurer requested: </strong>
                    {req.infoRequest}
                  </div>
                  {respondingId === req.id ? (
                    <div className="space-y-2">
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your response here..."
                        className="w-full rounded-xl border border-input p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setRespondingId(null)}
                          className="rounded-lg border border-input px-4 py-1.5 text-xs font-semibold hover:bg-accent"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={submittingReply}
                          onClick={() => handleSendReply(req.id)}
                          className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {submittingReply ? "Sending..." : "Send Reply"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setRespondingId(req.id);
                        setReplyText("");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Reply to Insurer
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
