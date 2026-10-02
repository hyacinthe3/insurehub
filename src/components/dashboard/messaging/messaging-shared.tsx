"use client";

/** Shared formatting and presentation helpers for the messaging channel. */

import { cn } from "@/lib/utils";
import type { ConversationSummary, MessageContextType } from "@/lib/api";

export const MESSAGE_BODY_MAX = 4000;
export const ATTACHMENTS_PER_MESSAGE_MAX = 4;
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
export const ATTACHMENTS_TOTAL_MAX_BYTES = 20 * 1024 * 1024;

/** Types the browser reports that the backend accepts. */
export const ACCEPTED_ATTACHMENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/csv",
  "text/rtf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

export function formatRwf(value: number): string {
  return `RWF ${value.toLocaleString("en-GB")}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function formatDayHeading(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86_400_000);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export const CONTEXT_TONE: Record<MessageContextType, string> = {
  general: "bg-muted text-muted-foreground border-border",
  product: "bg-primary/10 text-primary border-primary/25",
  quote: "bg-warning/15 text-warning-foreground border-warning/30",
  policy: "bg-success/12 text-success border-success/25",
};

export function contextBadge(type: MessageContextType, label: string) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        CONTEXT_TONE[type],
      )}
    >
      {label}
    </span>
  );
}

export function messageOf(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}

/** Preview text for a conversation row, including attachment-only messages. */
export function previewOf(summary: Pick<ConversationSummary, "preview" | "messageCount">): string {
  if (summary.messageCount === 0) return "No messages yet";
  return summary.preview || "Attachment";
}