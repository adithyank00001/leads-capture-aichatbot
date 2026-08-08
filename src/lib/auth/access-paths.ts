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
