import { CompareProvider } from "@/context/compare-context";
import { CompareBar } from "@/components/marketplace/compare-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { dashboardFor } from "@/lib/rbac";
import { getServerSession } from "@/lib/server-session";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  const authenticated = session.authenticated && !session.mfaPending && !!session.user;

  return (
    <CompareProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader authenticated={authenticated} dashboardHref={dashboardFor(session.user?.role)} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <CompareBar />
      </div>
    </CompareProvider>
  );
}

