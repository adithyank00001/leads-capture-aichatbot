import { requireLead } from "@/lib/api/handlers/leads";
import { buildAiMessages } from "@/lib/ai/conversation";
import { generateChatCompletion } from "@/lib/ai/openrouter";
import { getBusinessContext } from "@/lib/business/context";
import { createMessage, getMessagesBySession } from "@/lib/db/messages";
import { parseChatPayload } from "@/lib/validation/requests";

export async function sendChatMessage(body: unknown) {
  const input = parseChatPayload(body);

  await getBusinessContext(input.botId);
  await requireLead(input.botId, input.sessionId);

  const savedUserMessage = await createMessage({
    botId: input.botId,
    sessionId: input.sessionId,
    role: "user",
    content: input.message,
  });

  const conversation = await getMessagesBySession(input.botId, input.sessionId);
  const aiMessages = await buildAiMessages(input.botId, conversation);
  const assistantAnswer = await generateChatCompletion(aiMessages);

  const savedAssistantMessage = await createMessage({
    botId: input.botId,
    sessionId: input.sessionId,
    role: "assistant",
    content: assistantAnswer,
  });

  const messages = await getMessagesBySession(input.botId, input.sessionId);

  return {
    message: savedUserMessage,
    reply: savedAssistantMessage,
    answer: assistantAnswer,
    messages,
    aiConnected: true,
  };
}
