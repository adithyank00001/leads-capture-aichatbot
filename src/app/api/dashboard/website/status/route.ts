import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api/request";
import { requireDashboardApiUser } from "@/lib/auth/dashboard-session";
import { getBotByCustomerId } from "@/lib/db/bots";
import { getCustomerByUserId } from "@/lib/db/customers";
import {
  getWebsitePagesBySourceId,
  toWebsitePageStatusItem,
} from "@/lib/db/website-page";
import {
  getWebsiteSourceByBotId,
  toWebsiteStatusResponse,
} from "@/lib/db/website-source";
import { ensureCustomerOnboarding } from "@/lib/dashboard/onboarding";

export async function GET(request: Request) {
  try {
    const { supabase, user } = await requireDashboardApiUser();
    const summaryOnly =
      new URL(request.url).searchParams.get("summary") === "1";

    if (summaryOnly) {
      const customer = await getCustomerByUserId(supabase, user.id);
      const bot = customer
        ? await getBotByCustomerId(supabase, customer.id)
        : null;
      const source = bot
        ? await getWebsiteSourceByBotId(supabase, bot.bot_id)
        : null;

      return apiSuccess(toWebsiteStatusResponse(source));
    }

    const { bot } = await ensureCustomerOnboarding(supabase, {
      userId: user.id,
      email: user.email ?? "",
    });

    const source = await getWebsiteSourceByBotId(supabase, bot.bot_id);
    const pages = source
      ? (await getWebsitePagesBySourceId(supabase, source.id)).map(
          toWebsitePageStatusItem,
        )
      : [];

    return apiSuccess({
      ...toWebsiteStatusResponse(source),
      pages,
    });
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
