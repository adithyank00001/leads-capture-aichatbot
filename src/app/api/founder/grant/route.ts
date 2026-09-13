import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api/request";
import { hasFounderSession } from "@/lib/founder/auth";
import { grantFounderAccess, type FounderProduct } from "@/lib/founder/data";

export async function POST(request: Request) {
  try {
    if (!(await hasFounderSession())) {
      return apiError("UNAUTHORIZED", "Founder session required.", 401);
    }

    const body = (await request.json()) as {
      email?: string;
      product?: FounderProduct;
      note?: string;
    };

    if (!body.email || !body.product) {
      return apiError(
        "INVALID_INPUT",
        "Email and product are required.",
        400,
      );
    }

    if (!["product1", "product2", "both"].includes(body.product)) {
      return apiError("INVALID_INPUT", "Invalid product selection.", 400);
    }

    const result = await grantFounderAccess({
      email: body.email,
      product: body.product,
      note: body.note,
    });

    return apiSuccess(result);
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
