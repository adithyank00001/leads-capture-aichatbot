import type { Metadata } from "next";

import {
  LegalH2,
  LegalP,
  LegalPageShell,
  LegalSection,
} from "@/components/legal/legal-page-shell";
import { publicConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: `Terms of Service — ${publicConfig.appName}`,
  description:
    "Terms governing purchase and use of growscaleX digitally delivered lead-database products and related storefront services.",
};

export default function TermsOfServicePage() {
  return (
    <LegalPageShell title="Terms of Service" updated="18/09/2026">
      <LegalP>
        These Terms of Service (the &quot;Terms&quot;) form a binding agreement
        between you (&quot;Purchaser,&quot; &quot;you,&quot; or
        &quot;User&quot;) and growscaleX concerning access to the digital
        products storefront and the acquisition of electronically delivered
        merchandise, including without limitation aggregated contact databases,
        niche lead compilations, templates, scripts, and ancillary downloadable
        files (collectively, &quot;Digital Goods&quot;). Completion of checkout,
        initiation of payment, or continued browsing after notice of these Terms
        constitutes assent. If you do not agree, discontinue use immediately and
        do not consummate any purchase.
      </LegalP>

      <LegalSection>
        <LegalH2>1. Nature of the offering</LegalH2>
        <LegalP>
          Digital Goods are informational products supplied via electronic
          transmission (including Google Drive links, file downloads, or
          functionally equivalent delivery mechanisms). Upon successful payment
          confirmation, the Purchaser receives access credentials or download
          pathways constituting full performance of the Operator&apos;s delivery
          obligation. Because the essence of the bargain is the conveyance of
          reproducible digital content, the transaction is, by its nature,
          non-returnable once access has been provisioned.
        </LegalP>
      </LegalSection>

      <LegalSection>
        <LegalH2>2. License grant and use restrictions</LegalH2>
        <LegalP>
          Subject to timely payment and these Terms, the Operator grants a
          limited, non-exclusive, non-transferable, revocable-for-breach license
          to use purchased Digital Goods for the Purchaser&apos;s own lawful
          internal marketing, outreach, and research purposes. You shall not
          resell, sublicense, publicly redistribute, or commercially republish
          the raw datasets as a competing data product without prior written
          consent. Reverse engineering of delivery systems, scraping of the
          storefront, or circumvention of access controls is prohibited.
        </LegalP>
      </LegalSection>

      <LegalSection>
        <LegalH2>3. Payments; Razorpay; taxes</LegalH2>
        <LegalP>
          Prices displayed are denominated as indicated on the product page and
          are payable through Razorpay or such alternate processors as the
          Operator may designate. By authorizing payment you also accept the
          processor&apos;s applicable terms. The Operator does not store full
          card credentials. Applicable taxes, duties, or banking fees imposed by
          intermediaries may be collected or borne as required by law or
          processor rules. Authorization declines, insufficient funds, or
          incomplete KYC checks at the processor layer interrupt fulfillment
          without creating liability for consequential damages.
        </LegalP>
      </LegalSection>

      <LegalSection>
        <LegalH2>4. Delivery; risk of loss of control</LegalH2>
        <LegalP>
          Digital delivery is deemed complete when access instructions, download
          URLs, or equivalent materials are made available to the email address
          or on-screen confirmation channel associated with the order. From that
          moment, the Purchaser assumes exclusive dominion over copies obtained.
          The Operator retains no practical ability to retract, remotely wipe, or
          repossess files once disseminated, and therefore cannot unwind the
          transfer of informational value. Any subsequent loss of the
          Purchaser&apos;s local copies, Drive permissions altered by the
          Purchaser, or third-party account compromise does not reinstate a
          refund entitlement.
        </LegalP>
      </LegalSection>

      <LegalSection>
        <LegalH2>5. Disclaimers regarding data quality and results</LegalH2>
        <LegalP>
          Digital Goods are provided on an &quot;AS IS&quot; and &quot;AS
          AVAILABLE&quot; basis. While reasonable efforts are made to furnish
          useful compilations, the Operator does not warrant uninterrupted
          accuracy, completeness, deliverability of every contact record,
          suitability for a particular campaign, or any specific revenue outcome.
          Conversion rates, bounce rates, and connect rates are influenced by
          factors outside the Operator&apos;s control, including Purchaser
          messaging, tooling, timing, and compliance posture. No oral or written
          statement constitutes a guarantee of business results.
        </LegalP>
      </LegalSection>

      <LegalSection>
        <LegalH2>6. Compliance and lawful use</LegalH2>
        <LegalP>
          The Purchaser alone is responsible for ensuring that any use of
          acquired contacts complies with applicable telemarketing, WhatsApp,
          email, SMS, Do-Not-Call, GDPR/DPDP-equivalent, and spam laws in each
          jurisdiction of outreach. Purchase does not include legal advice or a
          license to engage in unlawful solicitation. The Operator may suspend
          future sales to parties reasonably believed to be misusing Digital
          Goods.
        </LegalP>
      </LegalSection>

      <LegalSection>
        <LegalH2>7. Limitation of liability</LegalH2>
        <LegalP>
          To the fullest extent permitted by law, the Operator&apos;s aggregate
          liability arising out of any purchase shall not exceed the amount
          actually paid to the Operator for the specific Digital Good giving rise
          to the claim. In no event shall the Operator be liable for indirect,
          incidental, special, consequential, exemplary, or lost-profit damages,
          whether based in contract, tort, or otherwise, even if advised of the
          possibility. Some jurisdictions disallow certain limitations; in such
          cases liability is limited to the minimum permitted.
        </LegalP>
      </LegalSection>

      <LegalSection>
        <LegalH2>8. Refunds cross-reference</LegalH2>
        <LegalP>
          All matters of refunds, chargebacks, and post-delivery dissatisfaction
          are governed exclusively by the Refund Policy, which is incorporated
          herein by reference. In the event of conflict on refund questions, the
          Refund Policy controls.
        </LegalP>
      </LegalSection>

      <LegalSection>
        <LegalH2>9. Contact</LegalH2>
        <LegalP>
          Notices and inquiries regarding these Terms may be directed to{" "}
              <a
                href="mailto:support@growscalex.com"
                className="font-medium text-[var(--landing-orange)] hover:underline"
              >
                support@growscalex.com
          </a>{" "}
          or submitted through{" "}
          <a href="/contact" className="font-medium text-[var(--landing-orange)] hover:underline">
            the contact form
          </a>
          . The Operator may update these Terms prospectively by posting a
          revised version; material continued use thereafter constitutes
          acceptance.
        </LegalP>
      </LegalSection>
    </LegalPageShell>
  );
}
