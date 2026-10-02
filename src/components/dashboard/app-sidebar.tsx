"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Settings, ShieldCheck } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { findModule, roleProfiles, visibleGroups, type Role } from "@/lib/rbac";
import { MessagingUnreadBadge } from "./messaging/unread-badge";

export function AppSidebar({ role }: { role: Role }) {
  const profile = roleProfiles[role];
  const groups = visibleGroups(role);
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname();

  const rootPath = `/dashboard/${role}`;
  const isActive = (slug: string) =>
    slug === "" ? pathname === rootPath : pathname === `${rootPath}/${slug}`;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-1 py-1.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-brand">
            <ShieldCheck className="h-5 w-5" />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight">InsureHub</p>
              <p className="truncate text-xs text-sidebar-foreground/70">{profile.workspace}</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild isActive={isActive(item.slug)} tooltip={item.label}>
                      <Link
                        href={item.slug === "" ? rootPath : `${rootPath}/${item.slug}`}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.slug === "messages" ? (
                      <MessagingUnreadBadge role={role} />
                    ) : item.badge ? (
                      <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          {findModule(role, "settings") && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Settings">
                <Link href={`${rootPath}/settings`}>
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          {/* Back to the public landing page — the session stays active. */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Home">
              <Link href="/">
                <House />
                <span>Home</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
