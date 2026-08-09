import { parseDemoAssistantMessage } from "@/lib/demo/format-assistant-message";
import { cn } from "@/lib/utils";

export function DemoAssistantMessage({ content }: { content: string }) {
  const blocks = parseDemoAssistantMessage(content);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {blocks.map((block, index) => {
        if (block.type === "bullet") {
          return (
            <p
              key={`${block.type}-${index}`}
              className="flex gap-2 leading-6"
            >
              <span aria-hidden className="shrink-0 font-semibold text-zinc-500">
                •
              </span>
              <span>{block.text}</span>
            </p>
          );
        }

        return (
          <p
            key={`${block.type}-${index}`}
            className={cn("leading-6", index > 0 && "pt-1")}
          >
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
