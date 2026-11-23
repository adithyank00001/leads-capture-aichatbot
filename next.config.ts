import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  // Ensure paid PDFs are bundled with store APIs and pages on Vercel.
  outputFileTracingIncludes: {
    "/api/store/download": [
      "./private/store/downloads/**/*",
      "./private/store/downloads/Access Link.pdf",
      "./private/store/downloads/ALL-INDIA-COMPLETE-DATABASE-PACKAGE-BUNDLE-2026.pdf",
      "./private/store/downloads/USA-LEADS-PREMIUM-PACK-2026.pdf",
      "./private/store/downloads/INDIA-PREMIUM-HNI-DATABASE-2026.pdf",
      "./private/store/downloads/ALL-INDIA-CAR-OWNERS-DATABASE-2026.pdf",
    ],
    "/api/store/razorpay/verify": [
      "./private/store/downloads/**/*",
      "./private/store/downloads/Access Link.pdf",
      "./private/store/downloads/ALL-INDIA-COMPLETE-DATABASE-PACKAGE-BUNDLE-2026.pdf",
      "./private/store/downloads/USA-LEADS-PREMIUM-PACK-2026.pdf",
      "./private/store/downloads/INDIA-PREMIUM-HNI-DATABASE-2026.pdf",
      "./private/store/downloads/ALL-INDIA-CAR-OWNERS-DATABASE-2026.pdf",
    ],
    "/api/store/razorpay/webhook": [
      "./private/store/downloads/**/*",
      "./private/store/downloads/Access Link.pdf",
      "./private/store/downloads/ALL-INDIA-COMPLETE-DATABASE-PACKAGE-BUNDLE-2026.pdf",
      "./private/store/downloads/USA-LEADS-PREMIUM-PACK-2026.pdf",
      "./private/store/downloads/INDIA-PREMIUM-HNI-DATABASE-2026.pdf",
      "./private/store/downloads/ALL-INDIA-CAR-OWNERS-DATABASE-2026.pdf",
    ],
    "/store/success": [
      "./private/store/downloads/**/*",
      "./private/store/downloads/Access Link.pdf",
      "./private/store/downloads/ALL-INDIA-COMPLETE-DATABASE-PACKAGE-BUNDLE-2026.pdf",
      "./private/store/downloads/USA-LEADS-PREMIUM-PACK-2026.pdf",
      "./private/store/downloads/INDIA-PREMIUM-HNI-DATABASE-2026.pdf",
      "./private/store/downloads/ALL-INDIA-CAR-OWNERS-DATABASE-2026.pdf",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/ntv0bhpy/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/embed/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *",
          },
        ],
      },
      {
        source: "/demo",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
