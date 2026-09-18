import type { Metadata } from "next";

import { ContactForm } from "@/components/legal/contact-form";
import { LegalPageShell, LegalP } from "@/components/legal/legal-page-shell";
import { publicConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: `Contact — ${publicConfig.appName}`,
  description:
    "Contact growscaleX support for digital product storefront questions. Email support@growscalex.com or use the contact form.",
};

export default function ContactPage() {
  return (
    <LegalPageShell title="Contact" updated="18/09/2026">
      <LegalP>
        For transactional inquiries, delivery clarifications, and storefront
        correspondence, reach the Operator at the channel below. For the
        avoidance of doubt, contacting support does not create, revive, or
        enlarge any refund entitlement beyond the narrow contingencies stated in
        the Refund Policy.
      </LegalP>

      <div className="rounded-lg border border-[#D8E2EC] bg-[#F7FAFC] px-4 py-4 sm:px-5">
        <p className="text-sm font-medium text-[var(--landing-navy)]">Email</p>
        <a
          href="mailto:support@growscalex.com"
          className="mt-1 inline-block text-[17px] font-semibold text-[var(--landing-orange)] hover:underline"
        >
          support@growscalex.com
        </a>
        <p className="mt-2 text-sm leading-relaxed text-[#5B6B7C]">
          Prefer the form? Fill it in and we will receive your message at the
          same inbox.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Send a message</h2>
        <ContactForm />
      </div>
    </LegalPageShell>
  );
}
