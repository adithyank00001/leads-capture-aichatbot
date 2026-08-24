import { apiError, apiSuccess } from "@/lib/api-response";
import { requireDashboardApiUser } from "@/lib/auth/dashboard-session";
import { ensureWidgetSettingsForBot } from "@/lib/db/bot-widget-settings";
import { getBotByCustomerId } from "@/lib/db/bots";
import { getCustomerByUserId } from "@/lib/db/customers";
import { purgeSoftDeletedLeadsOlderThanRetention } from "@/lib/db/leads";
import { handleRouteError } from "@/lib/api/request";

export async function GET() {
  try {
    try {
      await purgeSoftDeletedLeadsOlderThanRetention();
    } catch (purgeError) {
      console.error(
        JSON.stringify({
          level: "error",
          route: "dashboard/leads",
          category: "unknown",
          message:
            purgeError instanceof Error
              ? purgeError.message
              : "Soft-deleted lead purge failed.",
          timestamp: new Date().toISOString(),
        }),
      );
    }

    const { supabase, user } = await requireDashboardApiUser();
    const customer = await getCustomerByUserId(supabase, user.id);

    if (!customer) {
      return apiSuccess({ leads: [], fieldLabels: {} });
    }

    const bot = await getBotByCustomerId(supabase, customer.id);

    if (!bot) {
      return apiSuccess({ leads: [], fieldLabels: {} });
    }

    const widgetSettings = await ensureWidgetSettingsForBot(supabase, bot.bot_id);
    const fieldLabels = Object.fromEntries(
      widgetSettings.leadFields.map((field) => [field.id, field.label]),
    );

    const { data, error } = await supabase
      .from("chatbot_leads")
      .select("id, name, phone, email, custom_fields, page_url, session_id, created_at")
      .eq("bot_id", bot.bot_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return apiSuccess({
      leads: data ?? [],
      botId: bot.bot_id,
      fieldLabels,
    });
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
