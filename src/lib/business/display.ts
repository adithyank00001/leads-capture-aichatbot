import { getBusinessContext } from "@/lib/business/context";
import { getBotKnowledge } from "@/lib/db/bot-knowledge";
import { DEFAULT_CONSENT_TEXT } from "@/lib/privacy/consent";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type BusinessDisplay = {
  name: string;
  welcomeMessage: string;
  chatWelcomeMessage: string;
  consentText: string;
  privacyPolicyUrl: string | null;
};

export async function getBusinessDisplay(botId: string): Promise<BusinessDisplay> {
  try {
    const business = await getBusinessContext(botId);
    const supabase = getSupabaseAdmin();
    const knowledge = await getBotKnowledge(supabase, botId);

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
      consentText: knowledge?.consent_text ?? DEFAULT_CONSENT_TEXT,
      privacyPolicyUrl: knowledge?.privacy_policy_url ?? null,
    };
  } catch {
    return {
      name: "Business Chat",
      welcomeMessage: "Enter your details to start chatting with us.",
      chatWelcomeMessage: "How can we help you today?",
      consentText: DEFAULT_CONSENT_TEXT,
      privacyPolicyUrl: null,
    };
  }
}
