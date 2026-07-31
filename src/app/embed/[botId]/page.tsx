import { Suspense } from "react";

import { ChatbotWidget } from "@/components/chatbot/chatbot-widget";
import { getBusinessContext } from "@/lib/business/context";
import { getBusinessDisplay } from "@/lib/business/display";
import { getWidgetSettingsForEmbed } from "@/lib/widget/embed-config";
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
    const widgetSettings = await getWidgetSettingsForEmbed(botId);

    return (
      <div className="h-dvh bg-transparent">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              Loading chatbot...
            </div>
          }
        >
          <ChatbotWidget
            botId={botId}
            business={business}
            widgetSettings={widgetSettings}
          />
        </Suspense>
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
