import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api/request";
import {
  FOUNDER_COOKIE_NAME,
  createFounderSessionToken,
  founderCookieOptions,
  verifyFounderCredentials,
} from "@/lib/founder/auth";
import { assertFounderLoginRateLimit } from "@/lib/founder/rate-limit";

export async function POST(request: Request) {
  try {
    await assertFounderLoginRateLimit(request);

    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return apiError("INVALID_INPUT", "Email and password are required.", 400);
    }

    if (!verifyFounderCredentials({ email, password })) {
      return apiError("UNAUTHORIZED", "Invalid email or password.", 401);
    }

    const token = createFounderSessionToken();
    const response = apiSuccess({ ok: true });
    response.cookies.set(
      FOUNDER_COOKIE_NAME,
      token,
      founderCookieOptions(),
    );
    return response;
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
