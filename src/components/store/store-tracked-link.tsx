"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { trackStoreHomeProductClick } from "@/lib/meta/store-track";

type Props = {
  href: string;
  className?: string;
  children: ReactNode;
  /** Fire store ViewContent when the shop CTA is clicked */
  trackProductClick?: boolean;
};

/** Shop link that can fire Meta Pixel + CAPI without slowing the page. */
export function StoreTrackedLink({
  href,
  className,
  children,
  trackProductClick = false,
}: Props) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        if (trackProductClick) {
          trackStoreHomeProductClick();
        }
      }}
    >
      {children}
    </Link>
  );
}
