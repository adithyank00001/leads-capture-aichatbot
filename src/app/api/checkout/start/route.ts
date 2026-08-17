import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api/request";
import { startCheckoutForRequest } from "@/lib/billing/start-checkout-for-request";

export async function POST(request: Request) {
  try {
    const result = await startCheckoutForRequest(request);
    return apiSuccess(result);
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
