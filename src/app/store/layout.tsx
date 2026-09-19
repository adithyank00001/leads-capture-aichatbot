import { Fraunces, Manrope } from "next/font/google";
import type { ReactNode } from "react";

import "./store.css";

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

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://checkout.dodopayments.com" />
      <link rel="dns-prefetch" href="https://checkout.dodopayments.com" />
      <div
        className={`${display.variable} ${sans.variable} min-h-full bg-[var(--store-paper)] text-[var(--store-ink)]`}
      >
        {children}
      </div>
    </>
  );
}
