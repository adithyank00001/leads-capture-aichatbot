import type { Metadata } from "next";
import Link from "next/link";

import { BrandLogo } from "@/components/marketing/brand-logo";
import { publicConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: `Refund Policy — ${publicConfig.appName}`,
  description:
    "Our 30/30 lead guarantee and 100% money-back refund policy for one-time payment customers.",
};

export default function RefundPolicyPage() {
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
              Refund Policy
            </h1>
            <p className="text-sm text-[#8B9AAB]">
              <strong className="font-medium text-[#5B6B7C]">
                Last Updated:
              </strong>{" "}
              12/08/2026
            </p>
          </header>

          <p className="text-[17px] leading-relaxed text-[#3D4F63]">
            We designed our AI counselor with one specific goal: to help
            you capture more leads. We are completely confident in the
            software, which is why we offer a strictly results-based{" "}
            <strong className="font-semibold text-[var(--landing-navy)]">
              100% Money-Back Guarantee
            </strong>
            .
          </p>

          <p className="text-[17px] leading-relaxed text-[#3D4F63]">
            Because this is a one-time payment software, our refund policy is
            tied entirely to the performance of the product once it is actually
            deployed on your website.
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              The &quot;30/30&quot; Lead Guarantee
            </h2>
            <p className="text-[17px] leading-relaxed text-[#3D4F63]">
              You are entitled to a full, no-questions-asked refund if the AI
              counselor fails to generate a single lead for you, provided you
              meet the following installation criteria:
            </p>

            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  1. The Installation Window (30 Days)
                </h3>
                <p className="text-[17px] leading-relaxed text-[#3D4F63]">
                  To qualify for the guarantee, you must install the software
                  widget on your active, live website within{" "}
                  <strong className="font-semibold text-[var(--landing-navy)]">
                    30 days of your purchase date
                  </strong>
                  .
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  2. The Performance Window (30 Days)
                </h3>
                <p className="text-[17px] leading-relaxed text-[#3D4F63]">
                  Once the software is successfully installed and communicating
                  with our servers, your 30-day performance window begins. If
                  the AI counselor does not capture a single valid lead within the{" "}
                  <strong className="font-semibold text-[var(--landing-navy)]">
                    30 days following your installation date
                  </strong>
                  , we will refund 100% of your one-time payment.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              How to Request a Refund
            </h2>
            <p className="text-[17px] leading-relaxed text-[#3D4F63]">
              If you have installed the software, allowed it to run for the
              30-day performance window, and received zero leads, please contact
              us to initiate your refund.
            </p>
            <p className="text-[17px] leading-relaxed text-[#3D4F63]">
              To process your request quickly, please email{" "}
              <a
                href="mailto:support@growscalex.com"
                className="font-medium text-[var(--landing-orange)] hover:underline"
              >
                support@growscalex.com
              </a>{" "}
              with the following information:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-[17px] leading-relaxed text-[#3D4F63]">
              <li>The email address used to make the original purchase.</li>
              <li>The URL of the website where the widget was installed.</li>
              <li>
                A brief note confirming that no leads were generated during the
                30-day active period.
              </li>
            </ul>
            <p className="text-[17px] leading-relaxed text-[#3D4F63]">
              Once we verify the installation date and the lack of lead data in
              your dashboard, we will process your refund immediately. Funds
              typically take 3–5 business days to reflect on your original
              payment method.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              Exceptions to the Policy
            </h2>
            <p className="text-[17px] leading-relaxed text-[#3D4F63]">
              To protect against fraud and abuse of our one-time payment model,
              refunds{" "}
              <strong className="font-semibold text-[var(--landing-navy)]">
                will not
              </strong>{" "}
              be granted under the following conditions:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-[17px] leading-relaxed text-[#3D4F63]">
              <li>
                <strong className="font-semibold text-[var(--landing-navy)]">
                  Failure to Install:
                </strong>{" "}
                If you purchase the software but do not install it on a live
                website within the initial 30-day installation window.
              </li>
              <li>
                <strong className="font-semibold text-[var(--landing-navy)]">
                  Premature Removal:
                </strong>{" "}
                If the widget is removed from your website before the 30-day
                performance window has concluded.
              </li>
            </ul>
            <p className="text-[17px] leading-relaxed text-[#3D4F63]">
              If you need technical assistance getting the widget set up on your
              site to ensure you qualify for this guarantee, our support team is
              ready to help at{" "}
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
