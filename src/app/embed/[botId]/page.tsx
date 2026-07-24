import { ChatbotWidget } from "@/components/chatbot/chatbot-widget";
import { getBusinessContext } from "@/lib/business/context";
import { getBusinessDisplay } from "@/lib/business/display";
import { ApiValidationError } from "@/lib/validation/errors";

type EmbedPageProps = {
  params: Promise<{
    botId: string;
  }>;
};

export default async function EmbedPage({ params }: EmbedPageProps) {
  const { botId } = await params;

  try {
    await getBusinessContext(botId);
    const business = await getBusinessDisplay(botId);

    return (
      <div className="h-dvh bg-white">
        <ChatbotWidget botId={botId} business={business} />
      </div>
    );
  } catch (error) {
    if (error instanceof ApiValidationError && error.code === "UNKNOWN_BOT") {
      return (
        <div className="flex h-dvh items-center justify-center p-6 text-center text-sm text-zinc-600">
          This chatbot is not available.
        </div>
      );
    }

    throw error;
  }
}
