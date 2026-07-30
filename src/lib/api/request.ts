import { ApiValidationError } from "@/lib/validation/errors";
import { createErrorId, PUBLIC_ERROR_MESSAGE } from "@/lib/errors/public";
import { logServerError, type ErrorCategory } from "@/lib/errors/log";

type RouteErrorContext = {
  isPublicApi?: boolean;
  route?: string;
  botId?: string;
  sessionId?: string;
};

function categorizeError(error: unknown): ErrorCategory {
  if (error instanceof ApiValidationError) {
    if (error.code === "RATE_LIMITED") return "rate_limit";
    if (error.code === "USAGE_LIMIT_REACHED") return "usage_limit";
    if (error.code === "DOMAIN_NOT_ALLOWED") return "domain";
    if (error.code === "DOMAIN_NOT_CONFIGURED") return "domain";
    return "validation";
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("openrouter") || message.includes("ai ")) return "ai";
    if (message.includes("supabase") || message.includes("database")) {
      return "database";
    }
  }

  return "unknown";
}

export async function parseJsonBody(request: Request): Promise<unknown> {
  if (request.body === null) {
    throw new ApiValidationError("MISSING_BODY", "Request body is required.");
  }

  try {
    return await request.json();
  } catch {
    throw new ApiValidationError(
      "INVALID_JSON",
      "Request body must be valid JSON.",
    );
  }
}

export function handleRouteError(
  error: unknown,
  context: RouteErrorContext = {},
) {
  if (error instanceof ApiValidationError) {
    return {
      code: error.code,
      message: error.message,
      status: error.status,
      errorId: undefined,
    };
  }

  if (error instanceof Error && error.message === "Supabase is not configured.") {
    const errorId = context.isPublicApi ? createErrorId() : undefined;

    if (errorId && context.route) {
      logServerError({
        errorId,
        route: context.route,
        category: "database",
        botId: context.botId,
        sessionId: context.sessionId,
        message: error.message,
      });
    }

    return {
      code: "SUPABASE_NOT_CONFIGURED",
      message: context.isPublicApi
        ? PUBLIC_ERROR_MESSAGE
        : "Database is not configured on the server.",
      status: 500,
      errorId,
    };
  }

  const errorId = context.isPublicApi ? createErrorId() : undefined;
  const technicalMessage =
    error instanceof Error ? error.message : "An unexpected error occurred.";

  if (errorId && context.route) {
    logServerError({
      errorId,
      route: context.route,
      category: categorizeError(error),
      botId: context.botId,
      sessionId: context.sessionId,
      message: technicalMessage,
    });
  }

  return {
    code: "INTERNAL_ERROR",
    message: context.isPublicApi ? PUBLIC_ERROR_MESSAGE : technicalMessage,
    status: 500,
    errorId,
  };
}
