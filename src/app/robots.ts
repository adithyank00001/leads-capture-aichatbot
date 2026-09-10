import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/privacy-policy",
        "/terms-of-service",
        "/refund-policy",
        "/login",
        "/signup",
        "/checkout",
      ],
      // Do not use Disallow: "/" — that can block the whole site for crawlers.
      disallow: ["/landing-b", "/demo", "/dashboard", "/embed"],
    },
  };
}
