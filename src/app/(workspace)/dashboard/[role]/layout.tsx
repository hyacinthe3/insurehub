import { notFound, redirect } from "next/navigation";
import { Search } from "lucide-react";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { NotificationsMenu } from "@/components/dashboard/notifications-menu";
import { ProfileMenu } from "@/components/dashboard/profile-menu";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { isRole, roleProfiles } from "@/lib/rbac";
import { getServerSession } from "@/lib/server-session";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  if (!isRole(role)) notFound();

  // Server-side gate: the backend decides auth + MFA state, so hitting the
  // dashboard URL directly can never render protected UI.
  const session = await getServerSession();
  if (!session.authenticated) redirect("/auth/login");
  if (session.mfaPending || !session.user) redirect("/auth/mfa");
  // A signed-in account may only enter its own workspace.
  if (session.user.role !== role) redirect(`/dashboard/${session.user.role}`);

  const profile = roleProfiles[role];
  const displayName =
    session.user.fullName?.trim() || session.user.companyName?.trim() || profile.label;
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => (part[0] ?? "").toUpperCase())
    .join("");

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar role={role} />
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Slim logged-in header: global search, notifications, profile menu. */}
          <header className="glass-bar sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border px-3 sm:px-4">
            <SidebarTrigger />

            <div className="relative ml-1 hidden min-w-0 flex-1 items-center md:flex">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                aria-label="Search InsureHub"
                placeholder={`Search policies, claims, people…`}
                className="h-9 w-full max-w-md rounded-full border border-input bg-card pl-9 pr-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                aria-label="Search"
                className="grid h-9 w-9 place-items-center rounded-full border border-input text-muted-foreground transition-colors hover:bg-accent md:hidden"
              >
                <Search className="h-4 w-4" />
              </button>

              <NotificationsMenu role={role} />

              {/* Profile menu: avatar + signed-in user's name; closes on outside click. */}
              <ProfileMenu
                displayName={displayName}
                email={session.user.email}
                initials={initials}
                roleLabel={profile.label}
                role={role}
              />
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
