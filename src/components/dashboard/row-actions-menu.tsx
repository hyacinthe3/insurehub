"use client";

import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function RowActionsMenu({
  actions,
  disabled,
  onSelect,
}: {
  actions: string[];
  disabled?: (action: string) => boolean;
  onSelect?: (action: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Row actions"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-input text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="min-w-[9rem]">
        {actions.map((a) => (
          <DropdownMenuItem
            key={a}
            disabled={disabled?.(a)}
            onClick={() => onSelect?.(a)}
          >
            {a}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
