import { buildSystemPrompt } from "@/lib/business/prompt";
import { getBusinessContext } from "@/lib/business/context";
import type { AiChatMessage } from "@/lib/ai/openrouter";
import type { MessageRole } from "@/lib/db/messages";
import { retrieveWebsiteChunks } from "@/lib/rag/retrieve";

const AI_HISTORY_LIMIT = 5;

type ConversationMessage = {
  role: MessageRole;
  content: string;
};

export async function buildAiMessages(
  botId: string,
  conversation: ConversationMessage[],
  latestUserMessage?: string,
): Promise<AiChatMessage[]> {
  const business = await getBusinessContext(botId);
  const recentMessages = conversation.slice(-AI_HISTORY_LIMIT);
  const question =
    latestUserMessage?.trim() ||
    [...recentMessages].reverse().find((message) => message.role === "user")?.content ||
    "";

  const websiteChunks = question
    ? await retrieveWebsiteChunks(botId, question)
    : [];

  const systemPrompt = buildSystemPrompt(business, websiteChunks);

  return [
    { role: "system", content: systemPrompt },
    ...recentMessages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ];
}
