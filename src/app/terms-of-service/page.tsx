import type { Metadata } from "next";
import Link from "next/link";

import { BrandLogo } from "@/components/marketing/brand-logo";
import { publicConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: `Terms of Service — ${publicConfig.appName}`,
  description:
    "Terms of Service for growscalex AI software, including payment, usage limits, and refund policy.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white text-[var(--landing-navy)]">
      <header className="border-b border-[#D8E2EC]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-6 sm:px-6">
          <BrandLogo size="sm" />
          <Link
            href="/"
            className="text-sm font-medium text-[#5B6B7C] hover:text-[var(--landing-navy)] hover:underline"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <article className="space-y-8">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Terms of Service
            </h1>
            <p className="text-sm text-[#8B9AAB]">
              <strong className="font-medium text-[#5B6B7C]">
                Last Updated:
              </strong>{" "}
              12/08/2026
            </p>
          </header>

          <p className="text-[17px] leading-relaxed text-[#3D4F63]">
            Welcome to growscalex.com. These Terms of Service govern your use of
            the growscalex AI software and website. By purchasing or using our
            product, you agree to these terms.
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              1. General Usage and License
            </h2>
            <p className="text-[17px] leading-relaxed text-[#3D4F63]">
              growscalex AI provides an AI-powered sales assistant for your
              website. Upon purchasing our software, you are granted a
              non-exclusive, non-transferable license to install and use the
              widget on your website.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              2. Payment and Merchant of Record
            </h2>
            <p className="text-[17px] leading-relaxed text-[#3D4F63]">
              Our order process is conducted by our online reseller, Dodo
              Payments. Dodo Payments acts as the Merchant of Record for all our
              orders. They handle the payment processing, invoicing, and local
              tax compliance. By making a purchase, you also agree to Dodo
              Payments&apos; relevant terms and conditions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              3. Usage Limits
            </h2>
            <p className="text-[17px] leading-relaxed text-[#3D4F63]">
              While growscalex AI is sold as a one-time payment, the
              infrastructure required to run the AI features incurs ongoing
              costs. To ensure service stability, your one-time purchase includes
              a base allocation of 500 AI messages per month. If your website
              traffic and chat volume exceed this monthly limit, you may be
              required to upgrade or purchase additional message credits to
              maintain uninterrupted service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              4. Refund Policy
            </h2>
            <p className="text-[17px] leading-relaxed text-[#3D4F63]">
              Our refund policy is strictly results-based, offering a 100%
              money-back guarantee if the software fails to generate a single
              lead within 30 days of active installation. The specific rules,
              installation requirements, and timeframes for this guarantee are
              explicitly outlined on our dedicated{" "}
              <Link
                href="/refund-policy"
                className="font-medium text-[var(--landing-orange)] hover:underline"
              >
                Refund Policy
              </Link>{" "}
              page.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              5. Limitation of Liability
            </h2>
            <p className="text-[17px] leading-relaxed text-[#3D4F63]">
              growscalex and its developers shall not be held liable for any
              indirect, incidental, or consequential damages, including loss of
              data, loss of revenue, or business interruption arising from the
              use or inability to use the growscalex AI software.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              6. Modifications to Service
            </h2>
            <p className="text-[17px] leading-relaxed text-[#3D4F63]">
              We reserve the right to modify, update, or discontinue certain
              features of growscalex AI as the technology and third-party AI
              models we rely on evolve.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              7. Contact Information
            </h2>
            <p className="text-[17px] leading-relaxed text-[#3D4F63]">
              If you have any questions regarding these terms, please contact us
              at{" "}
              <a
                href="mailto:support@growscalex.com"
                className="font-medium text-[var(--landing-orange)] hover:underline"
              >
                support@growscalex.com
              </a>
              .
            </p>
          </section>
        </article>
      </main>

      <footer className="border-t border-[#D8E2EC]">
        <div className="mx-auto max-w-3xl px-4 py-8 text-center sm:px-6">
          <p className="text-[13px] text-[#8B9AAB]">
            © {new Date().getFullYear()} {publicConfig.appName}. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
