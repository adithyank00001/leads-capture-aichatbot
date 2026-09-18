import Link from "next/link";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/marketing/brand-logo";
import { publicConfig } from "@/lib/config";

const LEGAL_NAV = [
  { href: "/privacy-policy", label: "Privacy" },
  { href: "/terms-of-service", label: "Terms" },
  { href: "/refund-policy", label: "Refunds" },
  { href: "/contact", label: "Contact" },
] as const;

export function LegalPageShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-[var(--landing-navy)] [--landing-navy:#112437] [--landing-orange:#FC7B02] [--landing-orange-hover:#E36F02]">
      <header className="border-b border-[#D8E2EC]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-6 sm:px-6">
          <BrandLogo size="sm" href="/" />
          <nav className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs font-medium text-[#5B6B7C] sm:text-sm">
            {LEGAL_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-[var(--landing-navy)] hover:underline"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <article className="space-y-8">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
            <p className="text-sm text-[#8B9AAB]">
              <strong className="font-medium text-[#5B6B7C]">Last Updated:</strong> {updated}
            </p>
          </header>
          {children}
        </article>
      </main>

      <footer className="border-t border-[#D8E2EC]">
        <div className="mx-auto max-w-3xl space-y-3 px-4 py-8 text-center sm:px-6">
          <p className="text-[13px] text-[#8B9AAB]">
            Questions:{" "}
            <a
              href="mailto:support@growscalex.com"
              className="font-medium text-[var(--landing-orange)] hover:underline"
            >
              support@growscalex.com
            </a>
            {" · "}
            <Link href="/contact" className="font-medium text-[var(--landing-orange)] hover:underline">
              Contact form
            </Link>
          </p>
          <p className="text-[13px] text-[#8B9AAB]">
            © {new Date().getFullYear()} {publicConfig.appName}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export function LegalP({ children }: { children: ReactNode }) {
  return <p className="text-[17px] leading-relaxed text-[#3D4F63]">{children}</p>;
}

export function LegalH2({ children }: { children: ReactNode }) {
  return <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{children}</h2>;
}

export function LegalH3({ children }: { children: ReactNode }) {
  return <h3 className="text-lg font-semibold">{children}</h3>;
}

export function LegalSection({ children }: { children: ReactNode }) {
  return <section className="space-y-3">{children}</section>;
}
