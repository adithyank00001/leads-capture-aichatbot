const ALLOWED_OAUTH_NEXT_PATHS = [
  "/products",
  "/dashboard",
  "/location-leads",
  "/complete-profile",
  "/checkout",
] as const;

/** After login/signup, paid users pick a product here. */
export const PAID_HOME_PATH = "/products";
export const COMPLETE_PROFILE_PATH = "/complete-profile";

export function getSafeOAuthNextPath(nextPath?: string | null) {
  if (!nextPath) {
    return "/checkout";
  }

  const isAllowed = ALLOWED_OAUTH_NEXT_PATHS.some(
    (allowedPath) =>
      nextPath === allowedPath || nextPath.startsWith(`${allowedPath}/`),
  );

  if (!isAllowed || nextPath.startsWith("//") || nextPath.includes(":")) {
    return "/checkout";
  }

  return nextPath;
}

export type PostLoginAccess = {
  hasLifetimeAccess: boolean;
  hasMapsAccess?: boolean;
  profileCompleted?: boolean;
};

/** Where to send someone right after login / Google callback. */
export function resolvePostLoginRedirect(access: PostLoginAccess | boolean) {
  // Backward-compatible: older callers passed a boolean for Product 1 only.
  if (typeof access === "boolean") {
    return access ? PAID_HOME_PATH : "/checkout";
  }

  if (!access.profileCompleted) {
    return COMPLETE_PROFILE_PATH;
  }

  if (access.hasLifetimeAccess || access.hasMapsAccess) {
    return PAID_HOME_PATH;
  }

  return "/checkout";
}

export function getRequestOrigin(request: Request) {
  const { origin } = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return origin;
}

export function buildOAuthCallbackUrl(origin: string, _nextPath?: string) {
  // Must match Supabase Redirect URLs exactly (no ?next=...).
  return `${origin.replace(/\/+$/, "")}/auth/callback`;
}
