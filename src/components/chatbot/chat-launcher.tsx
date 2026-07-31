"use client";

import { MessageCircleMore } from "lucide-react";

import { Button } from "@/components/ui/button";

type ChatLauncherProps = {
  onOpen: () => void;
};

export function ChatLauncher({ onOpen }: ChatLauncherProps) {
  return (
    <div className="flex h-full w-full items-end justify-end">
      <Button
        type="button"
        variant="widgetAccent"
        onClick={onOpen}
        size="icon-lg"
        className="size-14 rounded-full shadow-lg"
        aria-label="Open chat"
      >
        <MessageCircleMore className="size-6" />
      </Button>
    </div>
  );
}
