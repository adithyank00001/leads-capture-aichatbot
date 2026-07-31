"use client";

import { X } from "lucide-react";

import { BusinessAvatar } from "@/components/chatbot/business-avatar";
import { Button } from "@/components/ui/button";

type ChatWidgetShellProps = {
  businessName: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function ChatWidgetShell({
  businessName,
  onClose,
  children,
}: ChatWidgetShellProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
      <header
        className="flex items-center gap-3 px-4 py-3"
        style={{
          backgroundColor: "var(--widget-header-bg)",
          color: "var(--widget-header-text)",
        }}
      >
        <BusinessAvatar name={businessName} size="sm" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-medium">{businessName}</h1>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="hover:bg-white/10 hover:text-[var(--widget-header-text)] focus-visible:ring-[var(--widget-header-text)]/40"
          style={{ color: "var(--widget-header-text)" }}
          aria-label="Close chat"
        >
          <X className="size-4" />
        </Button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
