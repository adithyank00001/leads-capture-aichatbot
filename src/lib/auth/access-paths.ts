export function isDashboardPath(pathname: string) {
  return (
    pathname.startsWith("/dashboard") || pathname.startsWith("/api/dashboard")
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
