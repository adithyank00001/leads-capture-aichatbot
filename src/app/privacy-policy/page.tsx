import type { Metadata } from "next";
import Link from "next/link";

import { BrandLogo } from "@/components/marketing/brand-logo";
import { publicConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: `Privacy Policy — ${publicConfig.appName}`,
  description:
    "How growscalex AI collects, uses, and protects information when you use our website and AI software.",
};

export default function PrivacyPolicyPage() {
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
              Privacy Policy
            </h1>
            <p className="text-sm text-[#8B9AAB]">
              <strong className="font-medium text-[#5B6B7C]">
                Last Updated:
              </strong>{" "}
              12/08/2026
            </p>
          </header>

          <p className="text-[17px] leading-relaxed text-[#3D4F63]">
            At growscalex, we take privacy seriously. This policy explains how we
            collect, use, and protect information when you use our website
            (growscalex.com) and the growscalex AI software.
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              1. Information We Collect
            </h2>
            <p className="text-[17px] leading-relaxed text-[#3D4F63]">
              We collect information in two distinct ways, depending on how you
              interact with our service:
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  A. Information from Our Customers (Business Owners)
                </h3>
                <p className="text-[17px] leading-relaxed text-[#3D4F63]">
                  When you purchase growscalex AI, we collect basic account
                  details necessary to provide the service. All payment and
                  billing information is securely processed by our Merchant of
                  Record, Dodo Payments, and is subject to their privacy and
                  security standards.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  B. Information from Website Visitors (End-Users)
                </h3>
                <p className="text-[17px] leading-relaxed text-[#3D4F63]">
                  When installed on a customer&apos;s website, the growscalex AI
                  widget interacts with website visitors.
                </p>
                <ul className="list-disc space-y-2 pl-6 text-[17px] leading-relaxed text-[#3D4F63]">
                  <li>
                    <strong className="font-semibold text-[var(--landing-navy)]">
                      Voluntary Data:
                    </strong>{" "}
                    The AI counselor is designed to collect lead information
                    (such as Name, Email, and Phone Number) only when the visitor
                    explicitly and voluntarily provides it during the chat.
                  </li>
                  <li>
                    <strong className="font-semibold text-[var(--landing-navy)]">
                      No Hidden Tracking:
                    </strong>{" "}
                    We do not use hidden methods to extract personal data from
                    visitors.
                  </li>
                  <li>
                    <strong className="font-semibold text-[var(--landing-navy)]">
                      Customization:
                    </strong>{" "}
                    Business owners have the ability to customize what
                    information the AI counselor requests from their visitors.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              2. How We Use the Data
            </h2>
            <ul className="list-disc space-y-2 pl-6 text-[17px] leading-relaxed text-[#3D4F63]">
              <li>
                <strong className="font-semibold text-[var(--landing-navy)]">
                  To Provide the Service:
                </strong>{" "}
                The primary use of collected end-user data is to pass the
                generated leads directly to the business owner who installed the
                software.
              </li>
              <li>
                <strong className="font-semibold text-[var(--landing-navy)]">
                  Third-Party AI Processing:
                </strong>{" "}
                To generate intelligent, conversational responses, the chat
                transcripts are securely processed using third-party AI models.
                These third-party services act as data processors strictly for the
                purpose of powering the chat interface.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              3. Data Storage and Security
            </h2>
            <p className="text-[17px] leading-relaxed text-[#3D4F63]">
              All collected lead information and account data are stored in a
              highly secured database. We implement strict industry-standard
              security measures to prevent unauthorized access, alteration,
              disclosure, or destruction of your data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              4. Data Sharing
            </h2>
            <p className="text-[17px] leading-relaxed text-[#3D4F63]">
              We do not sell, rent, or trade your personal data or your collected
              leads to outside companies. Data is only shared with:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-[17px] leading-relaxed text-[#3D4F63]">
              <li>
                <strong className="font-semibold text-[var(--landing-navy)]">
                  Dodo Payments:
                </strong>{" "}
                For managing purchases, billing, and global tax compliance.
              </li>
              <li>
                <strong className="font-semibold text-[var(--landing-navy)]">
                  Third-Party AI Providers:
                </strong>{" "}
                Exclusively for processing the chat text to generate responses.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              5. Your Rights and Contact
            </h2>
            <p className="text-[17px] leading-relaxed text-[#3D4F63]">
              If you are a customer and wish to access, correct, or delete your
              account data, or if you have any questions about how your data is
              handled, please reach out to us.
            </p>
            <p className="text-[17px] leading-relaxed text-[#3D4F63]">
              Contact Email:{" "}
              <a
                href="mailto:support@growscalex.com"
                className="font-medium text-[var(--landing-orange)] hover:underline"
              >
                support@growscalex.com
              </a>
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
