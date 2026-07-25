import { buildSystemPrompt } from "@/lib/business/prompt";
import { getBusinessContext } from "@/lib/business/context";
import type { AiChatMessage } from "@/lib/ai/openrouter";
import type { MessageRole } from "@/lib/db/messages";

const AI_HISTORY_LIMIT = 5;

type ConversationMessage = {
  role: MessageRole;
  content: string;
};

export async function buildAiMessages(
  botId: string,
  conversation: ConversationMessage[],
): Promise<AiChatMessage[]> {
  const business = await getBusinessContext(botId);
  const systemPrompt = buildSystemPrompt(business);
  const recentMessages = conversation.slice(-AI_HISTORY_LIMIT);

  return [
    { role: "system", content: systemPrompt },
    ...recentMessages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ];
}
