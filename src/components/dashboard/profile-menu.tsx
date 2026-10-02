"use client";

import Link from "next/link";
import { ChevronDown, Settings, UserRound } from "lucide-react";

import { LogoutButton } from "@/components/dashboard/logout-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Navbar profile menu (avatar + name). Uses Radix DropdownMenu so it closes
 * on any outside click or Escape.
 */
export function ProfileMenu({
  displayName,
  email,
  initials,
  roleLabel,
  role,
}: {
  displayName: string;
  email: string;
  initials: string;
  roleLabel: string;
  role: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-input py-1 pl-1 pr-2 transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary/30">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
          {initials}
        </span>
        <span className="hidden max-w-44 truncate text-xs font-semibold sm:inline">
          {displayName}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56">
        <DropdownMenuLabel className="p-0 font-normal">
          <p className="truncate px-2 py-1.5 text-sm font-semibold">{displayName}</p>
          <p className="truncate px-2 pb-1 text-xs font-semibold text-primary">{roleLabel}</p>
          <p className="truncate px-2 pb-1.5 text-xs text-muted-foreground">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/${role}/profile`}>
            <UserRound />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/${role}/settings`}>
            <Settings />
            Settings
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
  );
}
