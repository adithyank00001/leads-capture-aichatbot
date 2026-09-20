import type { ReactNode } from "react";

import { storeFontVariables } from "@/lib/store/fonts";

import "./store.css";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://checkout.dodopayments.com" />
      <link rel="dns-prefetch" href="https://checkout.dodopayments.com" />
      <div
        className={`${storeFontVariables} min-h-full bg-[var(--store-paper)] text-[var(--store-ink)]`}
      >
        {children}
      </div>
    </>
  );
}
