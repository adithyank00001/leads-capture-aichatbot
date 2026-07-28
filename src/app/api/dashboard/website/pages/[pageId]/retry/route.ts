import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api/request";
import { requireAuthUser } from "@/lib/auth/dashboard";
import { appendWebsiteBuildLog } from "@/lib/db/website-build-log";
import {
  countPendingPagesForSource,
  getWebsitePageForBot,
  retryWebsitePageRpc,
} from "@/lib/db/website-page";
import {
  getWebsiteSourceByBotId,
  isWebsiteBuildActive,
} from "@/lib/db/website-source";
import { ensureCustomerOnboarding } from "@/lib/dashboard/onboarding";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { triggerGasProcessPage } from "@/lib/website/ingestion";
import { ApiValidationError } from "@/lib/validation/errors";

type RouteContext = {
  params: Promise<{ pageId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { pageId } = await context.params;
    const { supabase, user } = await requireAuthUser();
    const { bot } = await ensureCustomerOnboarding(supabase, {
      userId: user.id,
      email: user.email ?? "",
    });

    const page = await getWebsitePageForBot(supabase, pageId, bot.bot_id);

    if (page.status !== "failed") {
      throw new ApiValidationError(
        "PAGE_NOT_RETRYABLE",
        "Only failed pages can be retried.",
        409,
      );
    }

    const source = await getWebsiteSourceByBotId(supabase, bot.bot_id);
    if (!source) {
      throw new ApiValidationError(
        "SOURCE_NOT_FOUND",
        "Website source not found.",
        404,
      );
    }

    if (
      isWebsiteBuildActive(source.status) &&
      (await countPendingPagesForSource(getSupabaseAdmin(), source.id)) > 0
    ) {
      throw new ApiValidationError(
        "BUILD_ALREADY_RUNNING",
        "A full website build is already running.",
        409,
      );
    }

    const retryResult = await retryWebsitePageRpc(pageId);

    if (
      !retryResult ||
      typeof retryResult !== "object" ||
      !("retried" in retryResult) ||
      !retryResult.retried
    ) {
      throw new ApiValidationError(
        "PAGE_NOT_RETRYABLE",
        "This page cannot be retried right now.",
        409,
      );
    }

    await appendWebsiteBuildLog({
      sourceId: source.id,
      botId: bot.bot_id,
      step: "page_retry",
      status: "started",
      message: `Retry requested for page ${page.page_url}`,
    });

    await triggerGasProcessPage({
      sourceId: source.id,
      botId: bot.bot_id,
      websiteUrl: source.website_url,
      pageId,
    });

    return apiSuccess({ accepted: true });
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
