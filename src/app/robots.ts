import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/store/product",
        "/privacy-policy",
        "/terms-of-service",
        "/refund-policy",
        "/login",
        "/signup",
        "/checkout",
      ],
      // Do not use Disallow: "/" — that can block the whole site for crawlers.
      disallow: [
        "/landing-old",
        "/landing-old-b2b",
        "/demo",
        "/products",
        "/dashboard",
        "/location-leads",
        "/complete-profile",
        "/embed",
      ],
    },
  };
}
