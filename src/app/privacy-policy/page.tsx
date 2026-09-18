import type { Metadata } from "next";

import {
  LegalH2,
  LegalH3,
  LegalP,
  LegalPageShell,
  LegalSection,
} from "@/components/legal/legal-page-shell";
import { publicConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: `Privacy Policy — ${publicConfig.appName}`,
  description:
    "Privacy practices applicable to the growscaleX digital products storefront, transactional identifiers, and support correspondence.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell title="Privacy Policy" updated="18/09/2026">
      <LegalP>
        This Privacy Policy constitutes the controlling disclosure regarding the
        manner in which growscaleX (&quot;Operator,&quot; &quot;we,&quot;
        &quot;us,&quot; or &quot;our&quot;) collects, processes, retains,
        discloses, and otherwise effectuates dealings in informational elements
        arising from your interaction with the digital products storefront
        operated at growscalex.com (including without limitation product listing
        pages, checkout initiation flows, payment-confirmation surfaces, and
        ancillary support channels). By accessing the storefront or completing a
        transaction for digitally delivered merchandise (including lead-database
        packages and associated downloadable materials), you acknowledge that
        you have read this instrument and consent to the processing described
        herein to the maximum extent permitted under applicable law.
      </LegalP>

      <LegalSection>
        <LegalH2>1. Scope of Contemplated Processing</LegalH2>
        <LegalP>
          The Operator&apos;s processing activities are circumscribed to those
          categories of data reasonably necessary to (a) authenticate purchase
          intent, (b) consummate payment through third-party payment
          infrastructure, (c) effectuate irreversible digital delivery of
          purchased assets, (d) respond to inbound support solicitations, and
          (e) maintain rudimentary fraud-prevention, dispute-handling, and
          operational continuity records. This Policy does not purport to govern
          third-party websites, payment processors, cloud-storage providers, or
          analytics vendors except insofar as their receipt of data is
          instrumentally required for the foregoing purposes.
        </LegalP>
      </LegalSection>

      <LegalSection>
        <LegalH2>2. Categories of Information Collected</LegalH2>
        <LegalH3>2.1 Transactional and identity-adjacent data</LegalH3>
        <LegalP>
          In connection with order formation you may furnish, or payment
          infrastructure may transmit to us, identifiers such as name fragments,
          electronic mail addresses, telephonic numbers, billing locality
          metadata, order identifiers, payment-status enumerations, and such
          other commercially reasonable fields as are returned by Razorpay or
          successor processors. Card primary account numbers and analogous
          sensitive payment instruments are processed by the payment provider
          and are not stored by the Operator as enduring cardholder data.
        </LegalP>
        <LegalH3>2.2 Technical telemetry</LegalH3>
        <LegalP>
          Automatic collection may include Internet Protocol addresses, browser
          and device characteristics, referring URLs, timestamps, cookie or
          local-storage tokens used for session continuity or offer-timer
          persistence, and diagnostic logs incidental to request routing. Such
          telemetry is processed for security hardening, abuse mitigation, and
          service diagnostics rather than for sale as an independent data
          product.
        </LegalP>
        <LegalH3>2.3 Support correspondence</LegalH3>
        <LegalP>
          Where you elect to communicate via{" "}
          <a
            href="mailto:support@growscalex.com"
            className="font-medium text-[var(--landing-orange)] hover:underline"
          >
            support@growscalex.com
          </a>{" "}
          or the contact form, we process the contents of your message, reply
          address, and any attachments or identifiers you voluntarily include,
          solely for triage and response.
        </LegalP>
      </LegalSection>

      <LegalSection>
        <LegalH2>3. Purposes and Legal Bases (as applicable)</LegalH2>
        <LegalP>
          Processing is undertaken to perform contractual obligations incident
          to digital-goods sales; to comply with bookkeeping, tax, and
          dispute-resolution duties; to pursue legitimate interests in securing
          the storefront against fraud; and, where mandated, pursuant to consent
          you provide for communications. Failure to supply data necessary for
          checkout may render fulfillment impossible without constituting a
          waiver of the Operator&apos;s all-sales-final posture described in the
          Refund Policy.
        </LegalP>
      </LegalSection>

      <LegalSection>
        <LegalH2>4. Disclosures to Processors and Service Providers</LegalH2>
        <LegalP>
          Without converting such disclosure into a sale of personal data for
          unrelated commercial exploitation, the Operator may transmit relevant
          subsets of information to: (i) Razorpay or alternative payment
          facilitators for authorization, capture, settlement, and chargeback
          workflows; (ii) hosting, database, and content-delivery providers
          necessary to operate the storefront; (iii) electronic-mail
          transmission vendors used to deliver transactional notices or support
          replies; and (iv) professional advisers under confidentiality
          constraints when required for legal or accounting purposes. Each such
          recipient is expected to process data only as instructed for the
          disclosed purpose, subject to their independent privacy terms.
        </LegalP>
      </LegalSection>

      <LegalSection>
        <LegalH2>5. Retention, Security, and Cross-Border Considerations</LegalH2>
        <LegalP>
          Records are retained for durations commensurate with operational need,
          statutory limitation periods, and chargeback windows, after which they
          are deleted or irreversibly anonymized where feasible. The Operator
          employs commercially reasonable administrative and technical
          safeguards; nevertheless, no method of electronic transmission or
          storage is infallible, and absolute security is not warranted.
          Infrastructure may reside in multiple jurisdictions; by using the
          storefront you consent to such transfers to the extent permitted by
          law.
        </LegalP>
      </LegalSection>

      <LegalSection>
        <LegalH2>6. Purchaser responsibilities regarding acquired datasets</LegalH2>
        <LegalP>
          Digital lead-database products deliver informational assets for the
          purchaser&apos;s independent commercial use. The Operator does not,
          by virtue of sale, assume the role of joint controller for any
          subsequent outreach, enrichment, or further processing the purchaser
          undertakes with acquired files. Compliance with telemarketing,
          anti-spam, data-protection, and consent regimes applicable to the
          purchaser&apos;s campaigns remains solely the purchaser&apos;s
          obligation.
        </LegalP>
      </LegalSection>

      <LegalSection>
        <LegalH2>7. Rights, inquiries, and contact channel</LegalH2>
        <LegalP>
          Subject to jurisdictional limitations, you may request access,
          rectification, or deletion of account-adjacent records we control by
          writing to{" "}
          <a
            href="mailto:support@growscalex.com"
            className="font-medium text-[var(--landing-orange)] hover:underline"
          >
            support@growscalex.com
          </a>
          , or by submitting the form at{" "}
          <a href="/contact" className="font-medium text-[var(--landing-orange)] hover:underline">
            /contact
          </a>
          . We may require reasonable identity verification before acting on a
          request. This Policy may be revised prospectively; continued use of
          the storefront after posting constitutes acceptance of the updated
          text.
        </LegalP>
      </LegalSection>
    </LegalPageShell>
  );
}
