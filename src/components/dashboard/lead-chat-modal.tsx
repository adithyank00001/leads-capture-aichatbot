"use client";

import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CHAT_RETENTION_DAYS, CHAT_RETENTION_NOTICE } from "@/lib/chat/retention";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

type LeadChatResponse = {
  ok: boolean;
  data?: {
    lead: {
      id: string;
      name: string;
      phone: string;
      created_at: string;
    };
    messages: ChatMessage[];
    retentionDays: number;
  };
  error?: {
    message: string;
  };
};

type LeadChatModalProps = {
  leadId: string;
  onClose: () => void;
};

export function LeadChatModal({ leadId, onClose }: LeadChatModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadCreatedAt, setLeadCreatedAt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadChat() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/dashboard/leads/${leadId}/messages`);
        const result = (await response.json()) as LeadChatResponse;

        if (!response.ok || !result.ok || !result.data) {
          throw new Error(result.error?.message ?? "Could not load chat.");
        }

        if (!isMounted) {
          return;
        }

        setLeadName(result.data.lead.name);
        setLeadPhone(result.data.lead.phone);
        setLeadCreatedAt(result.data.lead.created_at);
        setMessages(result.data.messages);
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error ? loadError.message : "Could not load chat.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadChat();

    return () => {
      isMounted = false;
    };
  }, [leadId]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        showCloseButton
      >
        <DialogHeader className="border-b px-4 py-4">
          <DialogTitle>{leadName || "Lead chat"}</DialogTitle>
          {leadPhone ? (
            <DialogDescription>{leadPhone}</DialogDescription>
          ) : null}
          {leadCreatedAt ? (
            <p className="text-xs text-muted-foreground">
              Lead captured: {new Date(leadCreatedAt).toLocaleString()}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">{CHAT_RETENTION_NOTICE}</p>
        </DialogHeader>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading chat...</p>
          ) : null}

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {!loading && !error && messages.length === 0 ? (
            <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
              No messages in the last {CHAT_RETENTION_DAYS} days.
            </p>
          ) : null}

          {!loading && !error
            ? messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p>{message.content}</p>
                    <p
                      className={`mt-2 text-xs ${
                        message.role === "user"
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            : null}
        </div>

        <DialogFooter className="border-t px-4 py-3 sm:justify-end">
          <Button type="button" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
