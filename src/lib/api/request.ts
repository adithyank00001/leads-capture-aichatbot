import { ApiValidationError } from "@/lib/validation/errors";

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

export function handleRouteError(error: unknown) {
  if (error instanceof ApiValidationError) {
    return {
      code: error.code,
      message: error.message,
      status: error.status,
    };
  }

  if (error instanceof Error && error.message === "Supabase is not configured.") {
    return {
      code: "SUPABASE_NOT_CONFIGURED",
      message: "Database is not configured on the server.",
      status: 500,
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message:
      error instanceof Error ? error.message : "An unexpected error occurred.",
    status: 500,
  };
}
