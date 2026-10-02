"use client";

import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { useState, type ReactNode } from "react";

import { logout } from "@/lib/api";

/** Calls the backend to destroy the session (and cookie), then exits. */
export function LogoutButton({
  children,
  ...props
}: {
  children?: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut(e: React.MouseEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      // Server-side session deletion is authoritative; the cookie is cleared
      // by the backend response.
      await logout();
    } catch {
      // Even if the network call fails, drop the client session on redirect.
    }
    router.replace("/auth/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={signOut} disabled={loading} {...props}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut />}
      {children ?? <span>Log out</span>}
    </button>
  );
}
