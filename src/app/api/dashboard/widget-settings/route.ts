import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAuthUser } from "@/lib/auth/dashboard";
import {
  ensureWidgetSettingsForBot,
  upsertWidgetSettingsForBot,
} from "@/lib/db/bot-widget-settings";
import { getBotByCustomerId } from "@/lib/db/bots";
import { getCustomerByUserId } from "@/lib/db/customers";
import { handleRouteError, parseJsonBody } from "@/lib/api/request";
import { parseWidgetSettingsPayload } from "@/lib/validation/widget-settings";

export async function GET() {
  try {
    const { supabase, user } = await requireAuthUser();
    const customer = await getCustomerByUserId(supabase, user.id);

    if (!customer) {
      throw new Error("Customer account not found.");
    }

    const bot = await getBotByCustomerId(supabase, customer.id);

    if (!bot) {
      throw new Error("Bot not found for this customer.");
    }

    const settings = await ensureWidgetSettingsForBot(supabase, bot.bot_id);

    return apiSuccess({ settings });
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}

export async function PUT(request: Request) {
  try {
    const { supabase, user } = await requireAuthUser();
    const body = await parseJsonBody(request);
    const input = parseWidgetSettingsPayload(body);

    const customer = await getCustomerByUserId(supabase, user.id);

    if (!customer) {
      throw new Error("Customer account not found.");
    }

    const bot = await getBotByCustomerId(supabase, customer.id);

    if (!bot) {
      throw new Error("Bot not found for this customer.");
    }

    const settings = await upsertWidgetSettingsForBot(supabase, bot.bot_id, {
      headerColor: input.headerColor,
      accentColor: input.accentColor,
      leadFormEnabled: input.leadFormEnabled,
      leadFields: input.leadFields,
    });

    return apiSuccess({ settings });
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
