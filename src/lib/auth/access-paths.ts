export function isDashboardPath(pathname: string) {
  return (
    pathname.startsWith("/dashboard") || pathname.startsWith("/api/dashboard")
  );
}

export function isLocationLeadsPath(pathname: string) {
  return (
    pathname.startsWith("/location-leads") ||
    pathname.startsWith("/api/location-leads")
  );
}

export function isProductsPath(pathname: string) {
  return pathname === "/products" || pathname.startsWith("/products/");
}

export function isCompleteProfilePath(pathname: string) {
  return (
    pathname === "/complete-profile" ||
    pathname.startsWith("/complete-profile/") ||
    pathname === "/api/account/profile"
  );
}

/** Logged-in app areas (chooser + both products + APIs). */
export function isPaidAppPath(pathname: string) {
  return (
    isProductsPath(pathname) ||
    isDashboardPath(pathname) ||
    isLocationLeadsPath(pathname) ||
    isCompleteProfilePath(pathname)
  );
}

/** Marketing pages that are closed to the public (checkout + policy pages stay open). */
export function isHiddenPublicMarketingPath(pathname: string) {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  return (
    normalized === "/" || normalized === "/landing-b" || normalized === "/demo"
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
  return (
    pathname === "/checkout/success" ||
    pathname.startsWith("/checkout/success/")
  );
}

export function isCheckoutApiPath(pathname: string) {
  return pathname === "/api/checkout" || pathname.startsWith("/api/checkout/");
}
