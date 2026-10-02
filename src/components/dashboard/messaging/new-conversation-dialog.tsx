"use client";

/**
 * Start a new conversation. The counterparty list comes from the backend's
 * relationship discovery, and the context list only contains records the pair
 * already shares — so this dialog cannot be used to reach anyone else.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, ShieldCheck, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  getMessageContexts,
  getMessagingDirectory,
  startConversation,
  type MessageContextOption,
  type MessageContextType,
  type MessagingDirectory,
} from "@/lib/api";
import { contextBadge, initialsOf, messageOf } from "./messaging-shared";

const CONTEXT_COPY: Record<MessageContextType, { label: string; hint: string }> = {
  general: { label: "General enquiry", hint: "No specific record attached" },
  quote: { label: "An application", hint: "About a submitted or pending application" },
  policy: { label: "A policy", hint: "About an active policy or renewal" },
  product: { label: "A product", hint: "About cover available to you" },
};

export function NewConversationDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (conversationId: string) => void;
}) {
  const [directory, setDirectory] = useState<MessagingDirectory | null>(null);
  const [contexts, setContexts] = useState<MessageContextOption[]>([]);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [contextType, setContextType] = useState<MessageContextType>("general");
  const [contextId, setContextId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contacts = useMemo(
    () =>
      (directory?.contacts ?? []).map((contact) => ({
        id: "brokerId" in contact ? contact.brokerId : contact.id,
        name: contact.name,
        email: contact.email,
        // A broker contact shows how the pair is linked; a customer contact
        // shows their company.
        meta:
          "brokerId" in contact
            ? contact.linkedVia.map((via) => VIA_LABELS[via] ?? via).join(", ")
            : contact.company || contact.email,
      })),
    [directory],
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getMessagingDirectory()
      .then((data) => {
        if (cancelled) return;
        setDirectory(data);
        setPeerId(null);
      })
      .catch((err) => !cancelled && setError(messageOf(err)));
    return () => {
      cancelled = true;
    };
  }, [open]);

  const loadContexts = useCallback((id: string | null) => {
    getMessageContexts(id ?? undefined)
      .then((data) => setContexts(data.items))
      .catch((err) => setError(messageOf(err)));
  }, []);

  useEffect(() => {
    if (!open) return;
    loadContexts(peerId);
  }, [open, peerId, loadContexts]);

  const options = useMemo(
    () => contexts.filter((item) => item.type === contextType),
    [contexts, contextType],
  );

  const selectedPeer = contacts.find((c) => c.id === peerId);
  // A record-scoped conversation must name its record; a general one has none.
  const canSubmit = contextType === "general" || contextId !== null;

  async function submit() {
    if (!peerId || submitting || !canSubmit) return;
    const option = options.find((o) => o.id === contextId);
    setSubmitting(true);
    setError(null);
    try {
      const thread = await startConversation({
        peerId,
        contextType,
        ...(contextType === "quote" && option ? { quoteRequestId: option.id } : {}),
        ...(contextType === "policy" && option ? { policyId: option.id } : {}),
        ...(contextType === "product" && option ? { productId: option.id } : {}),
        ...(message.trim() ? { message: message.trim() } : {}),
      });
      setMessage("");
      onOpenChange(false);
      onCreated(thread.conversation.id);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          // Reset on close so the next open starts clean.
          setError(null);
          setPeerId(null);
          setContextType("general");
          setContextId(null);
          setContexts([]);
          setMessage("");
          setDirectory(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New secure conversation</DialogTitle>
          <DialogDescription>
            You can only message brokers and customers you already work with.
          </DialogDescription>
        </DialogHeader>

        {contacts.length === 0 && directory && (
          <p className="rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
            No counterparties yet. Messaging becomes available once a broker handles an application
            or policy for you.
          </p>
        )}

        {contacts.length > 0 && (
          <ul className="max-h-56 space-y-1 overflow-y-auto">
            {contacts.map((contact) => (
              <li key={contact.id}>
                <button
                  type="button"
                  onClick={() => {
                    setPeerId(contact.id);
                    setContextId(null);
                    setError(null);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                    peerId === contact.id ? "border-primary bg-primary-soft/50" : "hover:bg-muted/60",
                  )}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {initialsOf(contact.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{contact.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {contact.meta || contact.email}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {peerId && (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              <Select
                value={contextType}
                onValueChange={(value) => {
                  setContextType(value as MessageContextType);
                  setContextId(null);
                }}
              >
                <SelectTrigger className="w-full rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CONTEXT_COPY) as MessageContextType[]).map((type) => (
                    <SelectItem key={type} value={type} className="rounded-lg">
                      {CONTEXT_COPY[type].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={contextId ?? ""}
                onValueChange={(value) => setContextId(value || null)}
                disabled={contextType === "general"}
              >
                <SelectTrigger className="w-full rounded-full">
                  <SelectValue placeholder={CONTEXT_COPY[contextType].hint} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.id} value={option.id} className="rounded-lg">
                      <span className="flex items-center gap-2">
                        {contextBadge(option.type, option.type)}
                        <span className="truncate">{option.title}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, 4000))}
              rows={3}
              placeholder={`Message ${selectedPeer?.name ?? ""}…`}
              aria-label="Opening message"
              className="resize-none"
            />
          </>
        )}

        {error && <p className="text-xs font-medium text-destructive">{error}</p>}

        <DialogFooter>
          <span className="mr-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3" />
            Private to this pair
          </span>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={!peerId || submitting || !canSubmit}
            className="gap-1.5"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRound className="h-4 w-4" />}
            Start conversation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const VIA_LABELS: Record<string, string> = {
  quote: "application",
  policy: "policy",
  book: "client book",
};
