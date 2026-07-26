import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAuthUser } from "@/lib/auth/dashboard";
import { getBotKnowledge, upsertBotKnowledge } from "@/lib/db/bot-knowledge";
import { getBotByCustomerId, updateBotBusinessName } from "@/lib/db/bots";
import { getCustomerByUserId } from "@/lib/db/customers";
import { ensureCustomerOnboarding } from "@/lib/dashboard/onboarding";
import { handleRouteError, parseJsonBody } from "@/lib/api/request";
import {
  listAllowedDomainsForDashboard,
  replaceAllowedDomains,
} from "@/lib/security/domain";
import { getBotUsageSummary } from "@/lib/usage/bot-usage";
import { parseBotSettingsPayload } from "@/lib/validation/bot-settings";

export async function GET() {
  try {
    const { supabase, user } = await requireAuthUser();
    const { bot } = await ensureCustomerOnboarding(supabase, {
      userId: user.id,
      email: user.email ?? "",
    });

    const knowledge = await getBotKnowledge(supabase, bot.bot_id);
    const allowedDomains = await listAllowedDomainsForDashboard(
      supabase,
      bot.bot_id,
    );
    const usage = await getBotUsageSummary(bot.bot_id);

    return apiSuccess({
      bot,
      knowledge,
      allowedDomains,
      usage,
    });
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}

export async function PUT(request: Request) {
  try {
    const { supabase, user } = await requireAuthUser();
    const body = await parseJsonBody(request);
    const input = parseBotSettingsPayload(body);

    const customer = await getCustomerByUserId(supabase, user.id);

    if (!customer) {
      throw new Error("Customer account not found.");
    }

    const bot = await getBotByCustomerId(supabase, customer.id);

    if (!bot) {
      throw new Error("Bot not found for this customer.");
    }

    const existingKnowledge = await getBotKnowledge(supabase, bot.bot_id);

    const updatedBot = await updateBotBusinessName(
      supabase,
      bot.bot_id,
      input.businessName,
    );

    const knowledge = await upsertBotKnowledge(supabase, bot.bot_id, {
      description: input.description,
      location: input.location,
      services: input.services,
      pricing_notes: input.pricingNotes,
      current_offer: input.currentOffer,
      opening_hours: input.openingHours,
      contact_method: input.contactMethod,
      extra_notes: input.extraNotes,
      consent_text: existingKnowledge?.consent_text ?? "",
      privacy_policy_url: existingKnowledge?.privacy_policy_url ?? null,
    });

    const allowedDomains = await replaceAllowedDomains(bot.bot_id, [
      input.allowedDomains,
    ]);

    const usage = await getBotUsageSummary(bot.bot_id);

    return apiSuccess({
      bot: updatedBot,
      knowledge,
      allowedDomains,
      usage,
    });
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
