import Link from "next/link";
import { BadgeCheck } from "lucide-react";

import { BrandLogo } from "@/components/marketing/brand-logo";

export function ProductHeader({ brandName }: { brandName: string }) {
  return (
    <header className="store-header">
      <div className="store-shell flex h-14 items-center justify-between sm:h-16">
        <div className="store-header-brand">
          <BrandLogo href="/" size="xs" className="store-header-logo" />
          <Link href="/" className="store-brand store-verified-badge">
            <BadgeCheck className="size-4 shrink-0" aria-hidden />
            {brandName}
          </Link>
        </div>
        <nav className="flex items-center gap-5 text-sm text-[var(--store-muted)]">
          <span className="hidden sm:inline">Digital products</span>
        </nav>
      </div>
    </header>
  );
}
