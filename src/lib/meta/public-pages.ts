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

/** Friendly labels for Meta PageView custom_data.content_name */
const META_PAGE_CONTENT_NAMES: Record<string, string> = {
  "/": "Home",
  "/landing-b": "Landing B",
  "/login": "Login",
  "/signup": "Signup",
  "/checkout": "Checkout",
  "/checkout/cancel": "Checkout Cancel",
  "/checkout/success": "Checkout Success",
  "/thank-you": "Thank You",
  "/privacy-policy": "Privacy Policy",
  "/terms-of-service": "Terms of Service",
  "/refund-policy": "Refund Policy",
};

export function isPublicMetaPagePath(pathname: string): boolean {
  if (!pathname || pathname.startsWith("/embed") || pathname.startsWith("/auth")) {
    return false;
  }

  if (pathname.startsWith("/dashboard")) {
    return false;
  }

  return PUBLIC_PAGE_EXACT.has(pathname);
}

/** Meta content_name for a public page path, or null if unknown. */
export function getMetaPageContentName(pathname: string): string | null {
  if (!pathname) {
    return null;
  }

  return META_PAGE_CONTENT_NAMES[pathname] ?? null;
}
