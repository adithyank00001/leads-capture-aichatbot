import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api/request";
import { requireAuthUser } from "@/lib/auth/dashboard";
import { getWebsiteBuildLogs } from "@/lib/db/website-build-log";
import {
  getWebsiteSourceByBotId,
  toWebsiteStatusResponse,
} from "@/lib/db/website-source";
import { ensureCustomerOnboarding } from "@/lib/dashboard/onboarding";

export async function GET() {
  try {
    const { supabase, user } = await requireAuthUser();
    const { bot } = await ensureCustomerOnboarding(supabase, {
      userId: user.id,
      email: user.email ?? "",
    });

    const source = await getWebsiteSourceByBotId(supabase, bot.bot_id);
    const logs = await getWebsiteBuildLogs(supabase, bot.bot_id, 40);

    return apiSuccess({
      ...toWebsiteStatusResponse(source),
      logs: logs.map((log) => ({
        id: log.id,
        side: log.side,
        step: log.step,
        status: log.status,
        message: log.message,
        createdAt: log.created_at,
      })),
    });
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
