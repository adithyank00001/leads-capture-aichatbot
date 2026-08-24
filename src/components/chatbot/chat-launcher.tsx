"use client";

import { MessageCircleMore } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatLauncherProps = {
  onOpen: () => void;
  /** Force large size (used by embed when the parent page is desktop). */
  large?: boolean;
};

export function ChatLauncher({ onOpen, large = false }: ChatLauncherProps) {
  return (
    <div className="flex h-full w-full items-end justify-end">
      <Button
        type="button"
        variant="widgetAccent"
        onClick={onOpen}
        size="icon-lg"
        className={cn(
          "size-14 rounded-full shadow-lg lg:size-[4.5rem]",
          large && "size-[4.5rem]",
        )}
        aria-label="Open chat"
      >
        <MessageCircleMore
          className={cn("size-6 lg:size-8", large && "size-8")}
        />
      </Button>
    </div>
  );
}
