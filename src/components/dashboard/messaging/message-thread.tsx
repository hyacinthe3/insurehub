"use client";

/** Right pane: the transcript, delivery receipts and the composer. */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownLeft,
  Check,
  CheckCheck,
  FileText,
  Loader2,
  Paperclip,
  Quote,
  Reply,
  SendHorizonal,
  ShieldCheck,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  attachmentUrl,
  type ChannelMessage,
  type ConversationThread,
  type OutgoingAttachment,
} from "@/lib/api";
import {
  ACCEPTED_ATTACHMENT_TYPES,
  ATTACHMENTS_PER_MESSAGE_MAX,
  ATTACHMENTS_TOTAL_MAX_BYTES,
  ATTACHMENT_MAX_BYTES,
  formatBytes,
  formatClock,
  formatDayHeading,
  initialsOf,
  MESSAGE_BODY_MAX,
  messageOf,
} from "./messaging-shared";

/** Attachment bytes are fetched with the session cookie, never by an <img>. */
function AttachmentImage({ attachment }: { attachment: { id: string; fileName: string } }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;
    fetch(attachmentUrl(`/messages/attachments/${attachment.id}/preview`), {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.blob() : Promise.reject(new Error("preview failed"))))
      .then((blob) => {
        if (cancelled) return;
        revoked = URL.createObjectURL(blob);
        setUrl(revoked);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [attachment.id]);

  if (failed) {
    return (
      <div className="flex h-28 w-40 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <FileText className="h-5 w-5" />
      </div>
    );
  }
  if (!url) {
    return <div className="h-28 w-40 animate-pulse rounded-lg bg-muted/70" />;
  }
  // The blob is already vetted by the backend's MIME allowlist.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={attachment.fileName}
      className="h-28 w-40 rounded-lg object-cover"
    />
  );
}

function Receipt({ message }: { message: ChannelMessage }) {
  if (message.kind === "system") return null;
  if (message.read) {
    return (
      <span className="inline-flex items-center gap-0.5 text-primary" title="Read">
        <CheckCheck className="h-3 w-3" />
      </span>
    );
  }
  if (message.delivered) {
    return (
      <span className="inline-flex items-center gap-0.5 text-muted-foreground" title="Delivered">
        <CheckCheck className="h-3 w-3" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-muted-foreground" title="Sent">
      <Check className="h-3 w-3" />
    </span>
  );
}

function Bubble({
  message,
  onReply,
}: {
  message: ChannelMessage;
  onReply: (message: ChannelMessage) => void;
}) {
  if (message.kind === "system") {
    return (
      <li className="flex justify-center py-1">
        <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
          {message.body}
        </span>
      </li>
    );
  }

  return (
    <li className={cn("flex gap-2.5", message.mine && "flex-row-reverse")}>
      <span
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold",
          message.mine ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
        )}
        aria-hidden
      >
        {message.mine ? "You" : initialsOf(message.senderName)}
      </span>
      <div className={cn("flex max-w-[min(38rem,78%)] flex-col gap-1", message.mine && "items-end")}>
        {!message.mine && (
          <span className="px-1 text-[11px] font-semibold text-muted-foreground">
            {message.senderName}
          </span>
        )}
        <div
          className={cn(
            "group relative rounded-2xl px-3.5 py-2.5 text-sm shadow-soft",
            message.mine
              ? "rounded-br-md bg-primary text-primary-foreground"
              : "rounded-bl-md border border-border bg-card text-foreground",
          )}
        >
          {message.replyTo && (
            <div
              className={cn(
                "mb-1.5 flex items-start gap-1.5 border-l-2 pl-2 text-[11px]",
                message.mine ? "border-primary-foreground/60" : "border-primary",
              )}
            >
              <Quote className="mt-0.5 h-3 w-3 shrink-0 opacity-70" />
              <span className="min-w-0">
                <span className="block font-semibold">{message.replyTo.senderName}</span>
                <span className="block truncate opacity-80">{message.replyTo.preview}</span>
              </span>
            </div>
          )}

          {message.body && <p className="whitespace-pre-wrap break-words">{message.body}</p>}

          {message.attachments.length > 0 && (
            <div
              className={cn(
                "mt-2 flex flex-wrap gap-2",
                message.attachments.length > 1 && "max-w-sm",
              )}
            >
              {message.attachments.map((attachment) =>
                attachment.kind === "image" && attachment.previewUrl ? (
                  <AttachmentImage key={attachment.id} attachment={attachment} />
                ) : (
                  <a
                    key={attachment.id}
                    href={attachmentUrl(attachment.downloadUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors",
                      message.mine
                        ? "border-primary-foreground/30 hover:bg-primary-foreground/10"
                        : "border-border bg-muted/50 hover:bg-muted",
                    )}
                  >
                    <ArrowDownLeft className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    <span className="min-w-0">
                      <span className="block max-w-[10rem] truncate">{attachment.fileName}</span>
                      <span className="block text-[10px] font-medium opacity-70">
                        {formatBytes(attachment.sizeBytes)}
                      </span>
                    </span>
                  </a>
                ),
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => onReply(message)}
            aria-label="Reply to this message"
            title="Reply"
            className={cn(
              "absolute -top-2.5 hidden h-6 w-6 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-soft transition-colors hover:text-foreground group-hover:grid",
              message.mine ? "-left-3" : "-right-3",
            )}
          >
            <Reply className="h-3 w-3" />
          </button>
        </div>
        <span className="flex items-center gap-1 px-1 text-[10px] font-medium text-muted-foreground">
          {formatClock(message.createdAt)}
          <Receipt message={message} />
        </span>
      </div>
    </li>
  );
}

export function MessageThread({
  thread,
  loading,
  sending,
  onSend,
  onLoadOlder,
  hasMore,
}: {
  thread: ConversationThread | null;
  loading: boolean;
  sending: boolean;
  onSend: (input: { body: string; replyToId?: string; attachments: OutgoingAttachment[] }) => Promise<void>;
  onLoadOlder: () => void;
  hasMore: boolean;
}) {
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<ChannelMessage | null>(null);
  const [files, setFiles] = useState<OutgoingAttachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [thread?.conversation.id, thread?.messages.length]);

  const totalBytes = useMemo(
    () => files.reduce((sum, file) => sum + Math.ceil((file.data.length * 3) / 4), 0),
    [files],
  );

  if (loading && !thread) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </span>
        <p className="mt-4 text-base font-semibold">Select a conversation</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Your messages stay private to you and the broker you are working with.
        </p>
      </div>
    );
  }

  const days: { day: string; messages: ChannelMessage[] }[] = [];
  for (const message of thread.messages) {
    const day = formatDayHeading(message.createdAt);
    const bucket = days[days.length - 1];
    if (bucket && bucket.day === day) bucket.messages.push(message);
    else days.push({ day, messages: [message] });
  }

  async function submit() {
    if (sending) return;
    const trimmed = body.trim();
    if (!trimmed && files.length === 0) return;
    setError(null);
    try {
      await onSend({
        body: trimmed,
        ...(replyTo ? { replyToId: replyTo.id } : {}),
        attachments: files,
      });
      setBody("");
      setReplyTo(null);
      setFiles([]);
    } catch (err) {
      setError(messageOf(err));
    }
  }

  async function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const incoming = Array.from(list);
    if (files.length + incoming.length > ATTACHMENTS_PER_MESSAGE_MAX) {
      setError(`You can attach up to ${ATTACHMENTS_PER_MESSAGE_MAX} files per message.`);
      return;
    }
    const accepted: OutgoingAttachment[] = [];
    for (const file of incoming) {
      if (!ACCEPTED_ATTACHMENT_TYPES.includes(file.type as (typeof ACCEPTED_ATTACHMENT_TYPES)[number])) {
        setError(`${file.name} is not a supported file type.`);
        return;
      }
      if (file.size > ATTACHMENT_MAX_BYTES) {
        setError(`${file.name} is larger than ${formatBytes(ATTACHMENT_MAX_BYTES)}.`);
        return;
      }
      const buffer = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (let i = 0; i < buffer.length; i += 1) binary += String.fromCharCode(buffer[i]);
      accepted.push({ fileName: file.name, contentType: file.type, data: btoa(binary) });
    }
    const combined = [...files, ...accepted];
    const bytes = combined.reduce((sum, file) => sum + Math.ceil((file.data.length * 3) / 4), 0);
    if (bytes > ATTACHMENTS_TOTAL_MAX_BYTES) {
      setError("Those files are too large to send together.");
      return;
    }
    setError(null);
    setFiles(combined);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        {hasMore && (
          <div className="mb-4 flex justify-center">
            <Button type="button" variant="outline" size="sm" onClick={onLoadOlder}>
              Load earlier messages
            </Button>
          </div>
        )}

        {thread.messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No messages yet. Send the first message below.
          </p>
        ) : (
          days.map((bucket) => (
            <section key={bucket.day} className="mb-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {bucket.day}
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <ul className="space-y-3">
                {bucket.messages.map((message) => (
                  <Bubble key={message.id} message={message} onReply={setReplyTo} />
                ))}
              </ul>
            </section>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border bg-card p-3 sm:p-4">
        {error && (
          <div className="mb-2 flex items-start justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
            <span>{error}</span>
            <button type="button" aria-label="Dismiss" onClick={() => setError(null)}>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {replyTo && (
          <div className="mb-2 flex items-start gap-2 rounded-lg border-l-2 border-primary bg-muted/60 px-3 py-2 text-xs">
            <Quote className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Replying to {replyTo.senderName}</span>
              <span className="block truncate text-muted-foreground">
                {replyTo.body || "Attachment"}
              </span>
            </span>
            <button type="button" aria-label="Cancel reply" onClick={() => setReplyTo(null)}>
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        )}

        {files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {files.map((file, index) => (
              <span
                key={`${file.fileName}-${index}`}
                className="flex items-center gap-2 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium"
              >
                <Paperclip className="h-3 w-3 text-muted-foreground" />
                <span className="max-w-[10rem] truncate">{file.fileName}</span>
                <button
                  type="button"
                  aria-label={`Remove ${file.fileName}`}
                  onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </span>
            ))}
            <span className="self-center text-[11px] font-medium text-muted-foreground">
              {formatBytes(totalBytes)} of {formatBytes(ATTACHMENTS_TOTAL_MAX_BYTES)}
            </span>
          </div>
        )}

        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_ATTACHMENT_TYPES.join(",")}
            className="hidden"
            onChange={(event) => {
              void addFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Attach files"
            title="Attach files"
            disabled={sending || files.length >= ATTACHMENTS_PER_MESSAGE_MAX}
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 rounded-full"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value.slice(0, MESSAGE_BODY_MAX))}
            onKeyDown={(event) => {
              // Enter sends, Shift+Enter breaks the line.
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submit();
              }
            }}
            rows={1}
            placeholder="Write a secure message…"
            aria-label="Message"
            className="max-h-40 min-h-10 flex-1 resize-none"
          />

          <Button
            type="button"
            size="icon"
            aria-label="Send message"
            title="Send message"
            disabled={sending || (!body.trim() && files.length === 0)}
            onClick={() => void submit()}
            className="shrink-0 rounded-full"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
          </Button>
        </div>

        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3" />
          Only you and your assigned broker can read this conversation.
        </p>
      </div>
    </div>
  );
}
