"use client";

/**
 * Sidebar badge for the Messages entry. Counts unread conversations for
 * customer/business/broker only — the insurer and admin workspaces have no
 * messaging channel.
 */

import { useEffect, useState } from "react";

import { getMessageUnreadTotal } from "@/lib/api";

export function MessagingUnreadBadge({
  role,
  children,
}: {
  role: string;
  children?: React.ReactNode;
}) {
  const [unread, setUnread] = useState(0);
  const enabled = role === "customer" || role === "business" || role === "broker";

  useEffect(() => {
    if (!enabled) return;
    let stopped = false;

    const poll = async () => {
      if (document.hidden) return;
      try {
        const result = await getMessageUnreadTotal();
        if (!stopped) setUnread(result.unread);
      } catch {
        // A failed badge refresh is not worth surfacing.
      }
    };

    const timer = setInterval(poll, 30_000);
    const onVisible = () => !document.hidden && void poll();
    document.addEventListener("visibilitychange", onVisible);
    void poll();
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled]);

  if (!enabled) return <>{children}</>;

  return (
    <>
      {children}
      {unread > 0 && (
        <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </>
  );
}
