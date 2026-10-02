import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";

import AdminCategories from "@/components/dashboard/admin-categories";
import AdminCompanies from "@/components/dashboard/admin-companies";
import AdminQuestions from "@/components/dashboard/admin-questions";
import {
  AdminBrokers,
  AdminCustomers,
} from "@/components/dashboard/admin-modules";
import { AdminClaims, AdminPolicies } from "@/components/dashboard/admin-operations";
import AdminProductReview from "@/components/dashboard/admin-product-review";
import {
  BrokerClaims,
  BrokerCommissions,
  BrokerCustomers,
  BrokerPolicies,
  BrokerQuotes,
  BrokerRenewals,
  BrokerReports,
  BrokerSettingsModule,
} from "@/components/dashboard/broker-modules";
import {
  InsurerClaims,
  InsurerCustomers,
  InsurerPayments,
  InsurerPolicies,
  InsurerProducts,
  InsurerQuoteRequests,
  InsurerReports,
} from "@/components/dashboard/insurer-modules";
import { BlockRenderer } from "@/components/dashboard/module-blocks";
import { MessagingWorkspace } from "@/components/dashboard/messaging-workspace";
import { EmptyState, PageHeader, StatCard } from "@/components/dashboard/ui-bits";
import { Button } from "@/components/ui/button";
import { findModule, isRole, roleProfiles } from "@/lib/rbac";
import { getServerSession } from "@/lib/server-session";
import { getModulePage } from "@/lib/workspace-data";
import NewlyIssuedPolicies from "../newly-issued-policies";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ role: string; module: string }>;
}): Promise<Metadata> {
  const { module } = await params;
  const title = `${module.replace(/(^|-)\w/g, (m) => m.toUpperCase()).replace(/-/g, " ")} — InsureHub`;
  return {
    title,
    description: `${title} workspace module inside the InsureHub platform.`,
    robots: { index: false },
    openGraph: {
      title,
      description: "InsureHub role-based workspace module.",
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ role: string; module: string }>;
}) {
  const { role, module } = await params;
  if (!isRole(role)) notFound();
  const item = findModule(role, module);

  if (!item) {
    return (
      <section className="px-5 py-16 lg:px-8">
        <div className="surface mx-auto max-w-lg p-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-muted">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </span>
          <h1 className="mt-4 text-xl font-bold">Module not available</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your {roleProfiles[role].label.toLowerCase()} role doesn&apos;t have permission to access this
            module.
          </p>
          <Button className="mt-6" asChild>
            <Link href={`/dashboard/${role}`}>Back to dashboard</Link>
          </Button>
        </div>
      </section>
    );
  }

  const page = getModulePage(role, module);

  // Messaging owns the full height of the workspace, so it renders its own
  // header instead of the standard page frame.
  if (module === "messages") {
    return (
      <div className="h-[calc(100vh-3.5rem)]">
        <MessagingWorkspace role={role} />
      </div>
    );
  }

  // Insurer module headers must read against the signed-in company only, never
  // a hard-coded example carrier name.
  let headerEyebrow = roleProfiles[role].scope;
  let headerTitle = page?.title ?? item.label;
  let headerDescription = page?.description;
  if (role === "insurer") {
    const session = await getServerSession();
    const company = session.user?.companyName?.trim();
    if (company) {
      headerEyebrow = `${company} — data only`;
      if (headerTitle === "Aegis Assurance - operations") headerTitle = `${company} — operations`;
      headerDescription = `${company} ${module} on InsureHub.`;
    }
  }

  // Broker module headers read as the signed-in agency's own book. The static
  // page actions are dropped because the live modules own their own actions.
  if (role === "broker") {
    const session = await getServerSession();
    const company = session.user?.companyName?.trim();
    headerEyebrow = company ? `${company} — broker` : "Broker workspace";
    headerDescription = company ? `${company} ${module} on InsureHub.` : `Your ${module} on InsureHub.`;
  }

  return (
    <section className="px-5 py-8 lg:px-8 lg:py-10">
      <div className="mx-auto w-full max-w-6xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <PageHeader
          eyebrow={headerEyebrow}
          title={headerTitle}
          description={headerDescription}
          icon={page?.icon ?? item.icon}
          actions={role === "broker" ? undefined : page?.actions}
        />

        {role === "admin" ? (
          (() => {
            switch (module) {
              case "companies":
                return <AdminCompanies />;
              case "brokers":
                return <AdminBrokers />;
              case "customers":
                return <AdminCustomers />;
              case "products":
                return <AdminProductReview />;
              case "policies":
                return <AdminPolicies />;
              case "claims":
                return <AdminClaims />;
              case "categories":
                return <AdminCategories />;
              case "questions":
                return <AdminQuestions />;
              default:
                return <>{page?.blocks.map((block, i) => <BlockRenderer key={i} block={block} />)}</>;
            }
          })()
        ) : role === "insurer" ? (
          (() => {
            switch (module) {
              case "products":
                return <InsurerProducts />;
              case "quote-requests":
                return <InsurerQuoteRequests />;
              case "customers":
                return <InsurerCustomers />;
              case "policies":
                return <InsurerPolicies />;
              case "claims":
                return <InsurerClaims />;
              case "reports":
                return <InsurerReports />;
              case "payments":
                return <InsurerPayments />;
              default:
                return <>{page?.blocks.map((block, i) => <BlockRenderer key={i} block={block} />)}</>;
            }
          })()
        ) : role === "broker" ? (
          (() => {
            switch (module) {
              case "customers":
                return <BrokerCustomers />;
              case "quotes":
                return <BrokerQuotes />;
              case "policies":
                return <BrokerPolicies />;
              case "renewals":
                return <BrokerRenewals />;
              case "claims":
                return <BrokerClaims />;
              case "commissions":
                return <BrokerCommissions />;
              case "reports":
                return <BrokerReports />;
              case "settings":
                return <BrokerSettingsModule />;
              default:
                return <>{page?.blocks.map((block, i) => <BlockRenderer key={i} block={block} />)}</>;
            }
          })()
        ) : (
          <>
            {role === "customer" && module === "policies" && <NewlyIssuedPolicies />}

            {page?.stats && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {page.stats.map((stat) => (
                  <StatCard key={stat.label} {...stat} />
                ))}
              </div>
            )}

            {page ? (
              page.blocks.map((block, i) => <BlockRenderer key={i} block={block} />)
            ) : (
              <div className="surface overflow-hidden">
                <EmptyState
                  title={`${item.label} is not set up yet`}
                  body="This module is part of your role but has no records yet. Anything you create will appear here."
                  action={{ label: "Back to dashboard" }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
