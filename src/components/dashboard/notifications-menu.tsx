"use client";

/**
 * In-app notification bell.
 *
 * Insurer workspaces keep the provider-wide `/insurer/notifications` feed;
 * customer, business and broker workspaces use the shared feed, which is
 * scoped to the signed-in account and includes message notifications that deep
 * link into the conversation.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Inbox, MessagesSquare } from "lucide-react";

import {
  getInsurerNotifications,
  getInsurerNotificationsUnreadCount,
  markAllInsurerNotificationsRead,
  markInsurerNotificationRead,
  getWorkspaceNotifications,
  getWorkspaceNotificationsUnreadCount,
  markAllWorkspaceNotificationsRead,
  markWorkspaceNotificationRead,
  type InsurerNotification,
  type WorkspaceNotification,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type FeedItem = (WorkspaceNotification | InsurerNotification) & { conversationId?: string | null };

type NotificationsMenuProps = {
  role: string;
  label?: string;
};

export function NotificationsMenu({ role, label = "notifications" }: NotificationsMenuProps) {
  const isInsurer = role === "insurer";
  const isWorkspace = role === "customer" || role === "business" || role === "broker";

  const [items, setItems] = useState<FeedItem[] | null>(isInsurer || isWorkspace ? null : []);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    if (isInsurer) {
      Promise.all([getInsurerNotifications(), getInsurerNotificationsUnreadCount()])
        .then(([list, count]) => {
          setItems(list);
          setUnread(count.unread);
        })
        .catch(() => setItems([]));
      return;
    }
    if (!isWorkspace) return;
    Promise.all([getWorkspaceNotifications(), getWorkspaceNotificationsUnreadCount()])
      .then(([list, count]) => {
        setItems(list);
        setUnread(count.unread);
      })
      .catch(() => setItems([]));
  }, [isInsurer, isWorkspace]);

  useEffect(() => {
    load();
    // Message notifications should surface without waiting for a page reload.
    if (!isWorkspace) return;
    const timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, [load, isWorkspace]);

  const markRead = async (id: string) => {
    try {
      if (isInsurer) await markInsurerNotificationRead(id);
      else await markWorkspaceNotificationRead(id);
    } catch {
      /* ignore */
    }
    load();
  };

  const markAll = async () => {
    try {
      if (isInsurer) await markAllInsurerNotificationsRead();
      else await markAllWorkspaceNotificationsRead();
    } catch {
      /* ignore */
    }
    load();
  };

  const list = items ?? [];
  const loading = (isInsurer || isWorkspace) && items === null;

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) load();
      }}
    >
      <DropdownMenuTrigger
        aria-label={label}
        title={label}
        className="relative grid h-9 w-9 place-items-center rounded-full border border-input text-muted-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-[22rem] p-0">
        <DropdownMenuLabel className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-sm font-bold">Notifications</span>
          {unread > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
              {unread} new
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {loading ? (
          <div className="flex flex-col gap-2 px-4 py-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-muted">
              <Inbox className="h-5 w-5 text-muted-foreground" />
            </span>
            <p className="text-sm font-semibold text-foreground">No notifications</p>
            <p className="text-xs text-muted-foreground">
              {isWorkspace
                ? "Application updates and new messages from your broker will appear here."
                : "Product approval, rejection and publishing updates will appear here."}
            </p>
          </div>
        ) : (
          <>
            <div className="max-h-80 overflow-y-auto">
              {list.map((n) => {
                const conversationId = "conversationId" in n ? n.conversationId : null;
                // Message notifications deep-link into the thread; everything
                // else stays in the feed.
                const href =
                  conversationId && isWorkspace
                    ? `/dashboard/${role}/messages?conversation=${encodeURIComponent(conversationId)}`
                    : null;

                const inner = (
                  <>
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        n.read ? "bg-transparent" : "bg-primary",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        {n.type === "message" && (
                          <MessagesSquare className="h-3.5 w-3.5 shrink-0 text-primary" />
                        )}
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {n.title}
                        </span>
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                        {n.body}
                      </span>
                      <span className="mt-1 block text-[11px] font-medium text-muted-foreground/70">
                        {timeAgo(n.createdAt)}
                      </span>
                    </span>
                  </>
                );

                const className = cn(
                  "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent",
                  !n.read && "bg-primary-soft/40",
                );

                return href ? (
                  <Link
                    key={n.id}
                    href={href}
                    className={className}
                    onClick={() => !n.read && void markRead(n.id)}
                  >
                    {inner}
                  </Link>
                ) : (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => !n.read && void markRead(n.id)}
                    className={className}
                  >
                    {inner}
                  </button>
                );
              })}
            </div>
            <DropdownMenuSeparator />
            <div className="flex items-center justify-between gap-2 px-4 py-2">
              {unread > 0 ? (
                <button
                  type="button"
                  onClick={markAll}
                  className="inline-flex items-center gap-1.5 rounded-full border border-input px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all as read
                </button>
              ) : (
                <span className="text-xs text-muted-foreground">You&apos;re all caught up</span>
              )}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
