import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAuthUser } from "@/lib/auth/dashboard";
import { getBotByCustomerId } from "@/lib/db/bots";
import { getCustomerByUserId } from "@/lib/db/customers";
import { handleRouteError } from "@/lib/api/request";

export async function GET() {
  try {
    const { supabase, user } = await requireAuthUser();
    const customer = await getCustomerByUserId(supabase, user.id);

    if (!customer) {
      return apiSuccess({ leads: [] });
    }

    const bot = await getBotByCustomerId(supabase, customer.id);

    if (!bot) {
      return apiSuccess({ leads: [] });
    }

    const { data, error } = await supabase
      .from("chatbot_leads")
      .select("id, name, phone, email, page_url, session_id, created_at")
      .eq("bot_id", bot.bot_id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return apiSuccess({
      leads: data ?? [],
      botId: bot.bot_id,
    });
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
