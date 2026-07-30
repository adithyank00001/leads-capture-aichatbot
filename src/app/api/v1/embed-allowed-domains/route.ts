import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api/request";
import { getBusinessContext } from "@/lib/business/context";
import { getAllowedDomainsForBot } from "@/lib/security/domain";
import { ApiValidationError } from "@/lib/validation/errors";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const botId = searchParams.get("botId")?.trim();

  try {
    if (!botId) {
      throw new ApiValidationError("MISSING_BOTID", "botId is required.");
    }

    await getBusinessContext(botId);
    const domains = await getAllowedDomainsForBot(botId);

    return apiSuccess({ domains });
  } catch (error) {
    const routeError = handleRouteError(error, {
      isPublicApi: true,
      route: "/api/v1/embed-allowed-domains",
      botId: botId ?? undefined,
    });
    return apiError(
      routeError.code,
      routeError.message,
      routeError.status,
      routeError.errorId,
    );
  }
}
