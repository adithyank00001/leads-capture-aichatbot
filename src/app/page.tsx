import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";

import { ShopHomePage } from "@/components/store/shop-home-page";

import "./store/store.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-store-display",
  weight: ["500", "600", "700"],
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-store-sans",
  weight: ["400", "500", "600", "700"],
});

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
    <div className={`${display.variable} ${sans.variable} min-h-full`}>
      <ShopHomePage />
    </div>
  );
}
