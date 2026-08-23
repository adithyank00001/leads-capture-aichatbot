/** Public marketing / checkout funnel paths that should send Meta PageView. */

const PUBLIC_PAGE_EXACT = new Set([
  "/",
  "/landing-b",
  "/login",
  "/signup",
  "/checkout",
  "/checkout/cancel",
  "/checkout/success",
  "/thank-you",
  "/privacy-policy",
  "/terms-of-service",
  "/refund-policy",
]);

export function isPublicMetaPagePath(pathname: string): boolean {
  if (!pathname || pathname.startsWith("/embed") || pathname.startsWith("/auth")) {
    return false;
  }

  if (pathname.startsWith("/dashboard")) {
    return false;
  }

  return PUBLIC_PAGE_EXACT.has(pathname);
}
