export type DemoAssistantMessageBlock =
  | { type: "paragraph"; text: string }
  | { type: "bullet"; text: string };

const BULLET_LINE_PATTERN = /^#\s+(.+)$/;

export function normalizeDemoAssistantMessage(content: string): string {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/([^\n])\s*(#\s+)/g, "$1\n$2")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function parseDemoAssistantMessage(
  content: string,
): DemoAssistantMessageBlock[] {
  const normalized = normalizeDemoAssistantMessage(content);
  const blocks: DemoAssistantMessageBlock[] = [];

  for (const line of normalized.split("\n")) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    const bulletMatch = trimmed.match(BULLET_LINE_PATTERN);

    if (bulletMatch) {
      blocks.push({ type: "bullet", text: bulletMatch[1].trim() });
      continue;
    }

    blocks.push({ type: "paragraph", text: trimmed });
  }

  return blocks;
}
