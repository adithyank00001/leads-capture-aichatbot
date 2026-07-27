import { requireLead } from "@/lib/api/handlers/leads";
import { buildAiMessages } from "@/lib/ai/conversation";
import { generateChatCompletion } from "@/lib/ai/openrouter";
import { getChatRetentionCutoffDate } from "@/lib/chat/retention";
import { getBusinessContext } from "@/lib/business/context";
import {
  createMessage,
  getMessagesForDisplay,
  getRecentMessagesForAi,
} from "@/lib/db/messages";
import { assertChatRateLimits } from "@/lib/rate-limit";
import { assertAllowedDomain } from "@/lib/security/domain";
import {
  assertBotCanUseAi,
  incrementMessageUsage,
} from "@/lib/usage/bot-usage";
import { parseChatPayload } from "@/lib/validation/requests";

export async function sendChatMessage(body: unknown, request: Request) {
  const input = parseChatPayload(body);

  await assertChatRateLimits(request, input.botId, input.sessionId);
  await getBusinessContext(input.botId);
  await assertAllowedDomain(request, input.botId, input.pageUrl);
  await requireLead(input.botId, input.sessionId);
  await assertBotCanUseAi(input.botId);

  const savedUserMessage = await createMessage({
    botId: input.botId,
    sessionId: input.sessionId,
    role: "user",
    content: input.message,
  });

  const conversation = await getRecentMessagesForAi(
    input.botId,
    input.sessionId,
    5,
  );
  const aiMessages = await buildAiMessages(
    input.botId,
    conversation,
    input.message,
  );
  const assistantAnswer = await generateChatCompletion(aiMessages);

  const savedAssistantMessage = await createMessage({
    botId: input.botId,
    sessionId: input.sessionId,
    role: "assistant",
    content: assistantAnswer,
  });

  await incrementMessageUsage(input.botId);

  const messages = await getMessagesForDisplay(
    input.botId,
    input.sessionId,
    getChatRetentionCutoffDate(),
  );

  return {
    message: savedUserMessage,
    reply: savedAssistantMessage,
    answer: assistantAnswer,
    messages,
    aiConnected: true,
  };
}
