const ALLOWED_OAUTH_NEXT_PATHS = ["/dashboard", "/checkout"] as const;

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

export function resolvePostLoginRedirect(hasLifetimeAccess: boolean) {
  return hasLifetimeAccess ? "/dashboard" : "/checkout";
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
