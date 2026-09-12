export function isDashboardPath(pathname: string) {
  return (
    pathname.startsWith("/dashboard") || pathname.startsWith("/api/dashboard")
  );
}

/** Paid product areas (chooser + both dashboards + Product 2 APIs). */
export function isPaidAppPath(pathname: string) {
  return (
    pathname === "/products" ||
    pathname.startsWith("/products/") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/location-leads") ||
    pathname.startsWith("/api/dashboard") ||
    pathname.startsWith("/api/location-leads")
  );
}

/** Marketing pages that are closed to the public (checkout + policy pages stay open). */
export function isHiddenPublicMarketingPath(pathname: string) {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  return (
    normalized === "/" ||
    normalized === "/landing-b" ||
    normalized === "/demo"
  );
}

export function isCheckoutPath(pathname: string) {
  return (
    pathname === "/checkout" ||
    pathname.startsWith("/checkout/") ||
    pathname === "/api/checkout" ||
    pathname.startsWith("/api/checkout/")
  );
}

export function isCheckoutLandingPath(pathname: string) {
  return pathname === "/checkout";
}

export function isGuestAllowedCheckoutPath(pathname: string) {
  return (
    pathname === "/checkout" ||
    pathname === "/checkout/cancel" ||
    pathname === "/api/checkout/guest"
  );
}

export function isCheckoutSuccessPath(pathname: string) {
  return pathname === "/checkout/success" || pathname.startsWith("/checkout/success/");
}

export function isCheckoutApiPath(pathname: string) {
  return (
    pathname === "/api/checkout" || pathname.startsWith("/api/checkout/")
  );
}
