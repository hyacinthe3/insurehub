"use client";

/**
 * Secure messaging workspace.
 *
 * Near-real-time without a socket server: while the tab is visible the client
 * polls `/messages/sync` with a cursor, which returns the conversations that
 * moved, the new messages inside them and the unread total in one round trip.
 * Polling pauses when the tab is hidden, and the read receipt is posted when a
 * thread is opened.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, MessagesSquare, PanelLeft, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getConversation,
  getConversationHistory,
  getConversations,
  markConversationRead,
  sendMessage,
  setConversationArchived,
  syncMessages,
  type ChannelMessage,
  type ConversationSummary,
  type ConversationThread,
  type OutgoingAttachment,
} from "@/lib/api";
import { messageOf } from "./messaging/messaging-shared";
import { ConversationList } from "./messaging/conversation-list";
import { ContextPanel } from "./messaging/context-panel";
import { MessageThread } from "./messaging/message-thread";
import { NewConversationDialog } from "./messaging/new-conversation-dialog";

/** Polling cadence — frequent enough to feel live, gentle on the API. */
const SYNC_INTERVAL_MS = 4000;

export function MessagingWorkspace({ role }: { role: string }) {
  const searchParams = useSearchParams();
  const deepLink = searchParams.get("conversation");

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<ConversationThread | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const cursorRef = useRef<string | undefined>(undefined);
  const isMessagingRole = role === "customer" || role === "business" || role === "broker";

  const loadThread = useCallback(async (id: string) => {
    setThreadLoading(true);
    try {
      const data = await getConversation(id);
      setThread(data);
      setHasMore(data.hasMore);
      setActiveId(id);
      setListOpen(false);
      cursorRef.current = new Date().toISOString();
      // Opening the thread is what advances delivery and read receipts.
      markConversationRead(id)
        .then((result) => setUnreadTotal(result.unread))
        .catch(() => undefined);
      setConversations((current) => current.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setThreadLoading(false);
    }
  }, []);

  /* ---- initial load ---------------------------------------------------- */

  useEffect(() => {
    if (!isMessagingRole) return;
    let stopped = false;
    getConversations()
      .then((list) => {
        if (!stopped) setConversations(list);
      })
      .catch((err) => !stopped && setError(messageOf(err)))
      .finally(() => {
        if (!stopped) setListLoading(false);
      });
    // The cursor starts here so the first poll only reports what happens next.
    cursorRef.current = new Date().toISOString();
    return () => {
      stopped = true;
    };
  }, [isMessagingRole]);

  /* ---- polling --------------------------------------------------------- */

  useEffect(() => {
    if (!isMessagingRole) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (stopped || document.hidden) return;
      try {
        const result = await syncMessages(cursorRef.current, activeId ?? undefined);
        if (stopped) return;
        cursorRef.current = result.serverTime;
        setUnreadTotal(result.unreadTotal);

        if (result.conversations.length > 0) {
          setConversations((current) => {
            const merged = new Map(current.map((c) => [c.id, c]));
            for (const conversation of result.conversations) merged.set(conversation.id, conversation);
            return [...merged.values()].sort(
              (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
            );
          });
        }

        // Own messages already arrive from the send call; everything else in the
        // open thread is the peer writing back.
        const incoming = result.messages
          .filter((m) => !m.message.mine && m.conversationId === activeId)
          .map((m) => m.message);
        if (incoming.length > 0 && activeId) {
          setThread((current) =>
            current && current.conversation.id === activeId
              ? { ...current, messages: mergeMessages(current.messages, incoming) }
              : current,
          );
          markConversationRead(activeId).catch(() => undefined);
        }
      } catch {
        // A failed poll is not surfaced; the next tick retries.
      }
    };

    const schedule = () => {
      if (stopped) return;
      timer = setTimeout(async () => {
        await tick();
        schedule();
      }, SYNC_INTERVAL_MS);
    };

    const onVisible = () => {
      if (!document.hidden) void tick();
    };

    void tick();
    schedule();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      document.removeEventListener("visibilitychange", onVisible);
      if (timer) clearTimeout(timer);
    };
  }, [isMessagingRole, activeId]);

  // A notification bell entry opens its thread directly.
  useEffect(() => {
    if (!deepLink) return;
    const timer = setTimeout(() => void loadThread(deepLink), 0);
    return () => clearTimeout(timer);
  }, [deepLink, loadThread]);

  /* ---- writing --------------------------------------------------------- */

  const send = useCallback(
    async (input: { body: string; replyToId?: string; attachments: OutgoingAttachment[] }) => {
      if (!activeId) return;
      setSending(true);
      try {
        const message = await sendMessage(activeId, input);
        setThread((current) =>
          current && current.conversation.id === activeId
            ? { ...current, messages: mergeMessages(current.messages, [message]) }
            : current,
        );
        setConversations((current) =>
          current.map((c) =>
            c.id === activeId
              ? {
                  ...c,
                  preview: message.body || "Attachment",
                  lastMessageAt: message.createdAt,
                  lastMessageIsMine: true,
                  messageCount: c.messageCount + 1,
                }
              : c,
          ),
        );
        cursorRef.current = new Date().toISOString();
      } finally {
        setSending(false);
      }
    },
    [activeId],
  );

  const loadOlder = useCallback(async () => {
    const oldest = thread?.messages[0]?.createdAt;
    if (!activeId || !oldest) return;
    try {
      const page = await getConversationHistory(activeId, { before: oldest });
      setThread((current) =>
        current ? { ...current, messages: mergeMessages(page.messages, current.messages) } : current,
      );
      setHasMore(page.hasMore);
    } catch (err) {
      setError(messageOf(err));
    }
  }, [activeId, thread]);

  const archiveActive = useCallback(async () => {
    if (!activeId) return;
    try {
      await setConversationArchived(activeId, true);
      setConversations((current) => current.filter((c) => c.id !== activeId));
      setActiveId(null);
      setThread(null);
    } catch (err) {
      setError(messageOf(err));
    }
  }, [activeId]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] min-h-0 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Show conversations"
            className="h-9 w-9 rounded-full lg:hidden"
            onClick={() => setListOpen(true)}
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-brand">
            <MessagesSquare className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold">Secure messages</h1>
            <p className="text-xs text-muted-foreground">
              {unreadTotal > 0 ? `${unreadTotal} unread` : "You’re all caught up"}
            </p>
          </div>
        </div>

        {activeId && (
          <Button type="button" variant="ghost" size="sm" onClick={() => void archiveActive()}>
            Archive conversation
          </Button>
        )}
      </header>

      {error && (
        <div className="flex items-center gap-2 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive sm:px-6">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{error}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setError(null)}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <aside
          className={cn(
            "w-full shrink-0 border-r border-border bg-card lg:block lg:w-80",
            listOpen ? "block" : "hidden",
          )}
        >
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={(id) => void loadThread(id)}
            onNew={() => setDialogOpen(true)}
            canStart
            loading={listLoading}
          />
        </aside>

        <main className="min-w-0 flex-1 bg-background">
          <MessageThread
            key={thread?.conversation.id ?? "empty"}
            thread={thread}
            loading={threadLoading}
            sending={sending}
            onSend={send}
            onLoadOlder={() => void loadOlder()}
            hasMore={hasMore}
          />
        </main>

        {thread && <ContextPanel conversation={thread.conversation} />}
      </div>

      <NewConversationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={(id) => void loadThread(id)}
      />
    </div>
  );
}

/** Merge by id, de-duplicated and kept in chronological order. */
function mergeMessages(existing: ChannelMessage[], incoming: ChannelMessage[]): ChannelMessage[] {
  const byId = new Map(existing.map((m) => [m.id, m]));
  for (const message of incoming) {
    // Receipts only ever move forward, so an older copy must not overwrite a
    // newer read/delivered state.
    const previous = byId.get(message.id);
    byId.set(
      message.id,
      previous
        ? {
            ...previous,
            ...message,
            delivered: previous.delivered || message.delivered,
            read: previous.read || message.read,
          }
        : message,
    );
  }
  return [...byId.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}
