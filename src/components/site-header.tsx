"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutDashboard, Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";

import { LogoutButton } from "@/components/dashboard/logout-button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Home" },
  { to: "/companies", label: "Providers" },
  { to: "/browse", label: "Browse insurance" },
  { to: "/compare", label: "Compare" },
  { to: "/partners", label: "For partners" },
] as const;

export function SiteHeader({
  authenticated = false,
  dashboardHref,
}: {
  authenticated?: boolean;
  dashboardHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <header className="sticky top-0 z-50 glass-bar border-b border-border">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3.5 lg:px-8">
        <div className="flex min-w-0 items-center gap-8">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-brand">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="truncate text-lg font-bold tracking-tight">InsureHub</span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.to}
                href={item.to}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive(item.to) && "bg-accent text-accent-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {authenticated ? (
            /* Signed in: no sign-in / get-started — offer the way out instead. */
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full border border-input py-2 pl-2 pr-2.5 transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary/30">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="w-56">
                <DropdownMenuItem asChild>
                  <Link href={dashboardHref ?? "/dashboard/customer"}>
                    <LayoutDashboard />
                    My dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  asChild
                  className="font-semibold text-destructive focus:text-destructive"
                >
                  <LogoutButton className="flex w-full cursor-pointer items-center gap-2" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/welcome">Get started</Link>
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-card px-5 py-3 lg:hidden">
          {nav.map((item) => (
            <Link
              key={item.to}
              href={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                "block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                isActive(item.to) && "bg-accent text-accent-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
