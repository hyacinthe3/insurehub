"use client";

/** Left rail: the conversation list with search, unread counts and a new thread. */

import { useMemo, useState } from "react";
import { MessageSquarePlus, Search, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ConversationSummary } from "@/lib/api";
import {
  contextBadge,
  initialsOf,
  previewOf,
  relativeTime,
} from "./messaging-shared";

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  canStart,
  loading,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  canStart: boolean;
  loading: boolean;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return conversations;
    return conversations.filter(
      (c) =>
        c.subject.toLowerCase().includes(needle) ||
        c.peer.name.toLowerCase().includes(needle) ||
        c.preview.toLowerCase().includes(needle) ||
        c.contextLabel.toLowerCase().includes(needle),
    );
  }, [conversations, query]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border p-3">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search conversations"
              aria-label="Search conversations"
              className="h-9 rounded-full pl-9 text-sm"
            />
          </div>
          {canStart && (
            <Button
              type="button"
              size="icon"
              aria-label="Start a new conversation"
              title="Start a new conversation"
              onClick={onNew}
              className="h-9 w-9 shrink-0 rounded-full"
            >
              <MessageSquarePlus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && conversations.length === 0 ? (
          <div className="space-y-2 p-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-muted">
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            </span>
            <p className="mt-3 text-sm font-semibold">
              {query ? "No matching conversations" : "No conversations yet"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {query
                ? "Try a different name or subject."
                : "Start a secure conversation with a broker you are working with."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((conversation) => {
              const active = conversation.id === activeId;
              return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(conversation.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex w-full items-start gap-3 px-3 py-3 text-left transition-colors",
                      active ? "bg-primary-soft/60" : "hover:bg-muted/50",
                    )}
                  >
                    <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {initialsOf(conversation.peer.name)}
                      {conversation.unread > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-card bg-primary" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "truncate text-sm",
                            conversation.unread > 0 ? "font-bold text-foreground" : "font-semibold text-foreground",
                          )}
                        >
                          {conversation.peer.name}
                        </span>
                        <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
                          {relativeTime(conversation.lastMessageAt)}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5">
                        {contextBadge(conversation.contextType, conversation.contextLabel)}
                        <span className="truncate text-[11px] text-muted-foreground">
                          {conversation.subject}
                        </span>
                      </span>
                      <span className="mt-1 flex items-center gap-2">
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate text-xs",
                            conversation.unread > 0
                              ? "font-semibold text-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          {conversation.lastMessageIsMine ? "You: " : ""}
                          {previewOf(conversation)}
                        </span>
                        {conversation.unread > 0 && (
                          <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                            {conversation.unread > 99 ? "99+" : conversation.unread}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
