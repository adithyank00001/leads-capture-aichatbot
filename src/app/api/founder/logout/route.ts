import { apiSuccess } from "@/lib/api-response";
import {
  FOUNDER_COOKIE_NAME,
  founderCookieOptions,
} from "@/lib/founder/auth";

export async function POST() {
  const response = apiSuccess({ ok: true });
  response.cookies.set(FOUNDER_COOKIE_NAME, "", {
    ...founderCookieOptions(0),
    maxAge: 0,
  });
  return response;
}
