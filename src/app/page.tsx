import type { Metadata } from "next";

import { ShopHomePage } from "@/components/store/shop-home-page";
import { storeFontVariables } from "@/lib/store/fonts";

import "./store/store.css";

export const metadata: Metadata = {
  title: {
    absolute: "Buy Premium Lead Databases | growscaleX Store",
  },
  description:
    "Shop verified PAN India leads, USA leads, and growth tools. Instant Google Drive delivery. Secure checkout with Razorpay.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: "Buy Premium Lead Databases | growscaleX Store",
    description:
      "Shop verified PAN India leads, USA leads, and growth tools. Instant Google Drive delivery.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Buy Premium Lead Databases | growscaleX Store",
    description:
      "Shop verified PAN India leads, USA leads, and growth tools. Instant delivery.",
  },
};

export default function HomePage() {
  return (
    <div className={`${storeFontVariables} min-h-full`}>
      <ShopHomePage />
    </div>
  );
}
