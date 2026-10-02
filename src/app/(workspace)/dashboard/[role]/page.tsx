import type { Metadata } from "next";
import { notFound } from "next/navigation";

import AdminOverview from "@/components/dashboard/admin-overview";
import { BrokerOverview } from "@/components/dashboard/broker-modules";
import { InsurerOverview } from "@/components/dashboard/insurer-modules";
import { BlockRenderer } from "@/components/dashboard/module-blocks";
import { PageHeader, StatCard } from "@/components/dashboard/ui-bits";
import { roleDashboards } from "@/lib/dashboard-data";
import { isRole } from "@/lib/rbac";
import { getServerSession } from "@/lib/server-session";
import { overviewPages } from "@/lib/workspace-overviews";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ role: string }>;
}): Promise<Metadata> {
  const { role } = await params;
  const seo = isRole(role)
    ? roleDashboards[role].seo
    : { title: "Dashboard — InsureHub", description: "InsureHub workspace dashboard." };
  return {
    title: seo.title,
    description: seo.description,
    openGraph: {
      title: seo.title,
      description: seo.description,
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function RoleDashboardPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  if (!isRole(role)) notFound();
  const page = overviewPages[role];

  // Greet the signed-in user by their real first name on the customer overview.
  const session = await getServerSession();
  let title = page.title;
  let description = page.description;
  if (role === "customer" && title === "You're covered") {
    const first = session.user?.fullName?.trim().split(/\s+/)[0];
    if (first) title = `You're covered, ${first}`;
  }
  // The insurer overview must read as the signed-in company's own dashboard,
  // never a hard-coded example carrier.
  let eyebrow = "Overview";
  if (role === "insurer") {
    const company = session.user?.companyName?.trim();
    title = company ? `${company} — operations` : "Company operations";
    eyebrow = company ? `${company} — data only` : "Your company data only";
  }
  // The broker overview reads as the signed-in agency's own book, never a
  // hard-coded example brokerage.
  if (role === "broker") {
    const company = session.user?.companyName?.trim();
    title = company ?? "Your book";
    eyebrow = company ? `${company} — broker` : "Broker workspace";
    description = "Live view of the clients, quotes, policies and commissions in your book.";
  }

  return (
    <section className="px-5 py-8 lg:px-8 lg:py-10">
      <div className="mx-auto w-full max-w-6xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <PageHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
          icon={page.icon}
          actions={role === "broker" ? undefined : page.actions}
        />

        {role === "admin" ? (
          <AdminOverview />
        ) : role === "insurer" ? (
          <InsurerOverview />
        ) : role === "broker" ? (
          <BrokerOverview />
        ) : (
          <>
            {page.stats && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {page.stats.map((stat) => (
                  <StatCard key={stat.label} {...stat} />
                ))}
              </div>
            )}

            {page.blocks.map((block, i) => (
              <BlockRenderer key={i} block={block} />
            ))}
          </>
        )}
      </div>
    </section>
  );
}
