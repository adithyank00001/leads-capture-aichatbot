import type { ReactNode } from "react";

import { storeFontVariables } from "@/lib/store/fonts";

import "./store.css";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${storeFontVariables} min-h-full bg-[var(--store-paper)] text-[var(--store-ink)]`}
    >
      {children}
    </div>
  );
}
