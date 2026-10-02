"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, FileText, ArrowRight, Handshake } from "lucide-react";
import { FlowShell } from "@/components/flow/flow-ui";

export default function QuoteSubmittedClient({ requestId }: { requestId: string }) {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const broker = searchParams.get("broker");
  const trackHref = email
    ? `/my-quotes?email=${encodeURIComponent(email)}`
    : "/my-quotes";

  return (
    <FlowShell
      step="review"
      eyebrow="Quote Request Submitted"
      title="Application Received! 🎉"
      description="Your request has been successfully submitted to the insurance company for review."
    >
      <div className="surface space-y-6 p-8 text-center sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Request Reference #{requestId.slice(-8)}</h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            The insurance company is now reviewing your application and risk parameters. No payment is required until you receive and accept your official quote.
          </p>
        </div>

        {broker && (
          <div className="mx-auto flex max-w-lg items-start gap-3 rounded-2xl border border-primary/25 bg-primary/8 p-4 text-left">
            <Handshake className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">A broker/agent will assist you</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Your application has been shared with <strong>{broker}</strong>, who will track it with the insurer and help you through the next steps.
              </p>
            </div>
          </div>
        )}

        <div className="mx-auto grid max-w-lg gap-4 text-left sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              What Happens Next?
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              The insurer will evaluate your application within 24-48 hours and send a custom quote to your email.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <FileText className="h-4 w-4 text-primary" />
              Track Progress
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              You can check the status of your application, respond to info requests, or accept your quote at any time.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link
            href={trackHref}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-brand hover:bg-primary/90"
          >
            Track My Quote Requests
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 rounded-full border border-input px-6 py-3 text-sm font-semibold hover:bg-accent"
          >
            Return to Marketplace
          </Link>
        </div>
      </div>
    </FlowShell>
  );
}