import { getBusinessContext } from "@/lib/business/context";

export type BusinessDisplay = {
  name: string;
  welcomeMessage: string;
  chatWelcomeMessage: string;
};

export async function getBusinessDisplay(botId: string): Promise<BusinessDisplay> {
  try {
    const business = await getBusinessContext(botId);

    const welcomeMessage = business.description
      ? `Enter your details below. ${business.description}`
      : "Enter your details below and we will help answer your questions.";

    const chatWelcomeMessage = business.description
      ? business.description
      : "How can we help you today?";

    return {
      name: business.name,
      welcomeMessage,
      chatWelcomeMessage,
    };
  } catch {
    return {
      name: "Business Chat",
      welcomeMessage: "Enter your details to start chatting with us.",
      chatWelcomeMessage: "How can we help you today?",
    };
  }
}
