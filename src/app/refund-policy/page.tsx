import type { Metadata } from "next";

import {
  LegalH2,
  LegalP,
  LegalPageShell,
  LegalSection,
} from "@/components/legal/legal-page-shell";
import { publicConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: `Refund Policy — ${publicConfig.appName}`,
  description:
    "All-sales-final refund policy for growscaleX digitally delivered products following irreversible access provisioning.",
};

export default function RefundPolicyPage() {
  return (
    <LegalPageShell title="Refund Policy" updated="18/09/2026">
      <LegalP>
        This Refund Policy sets forth the exclusive and exhaustive framework
        governing any purported claim for reimbursement, reversal, credit,
        chargeback cooperation, or analogous monetary restoration arising from
        the purchase of digitally delivered merchandise from growscaleX. By
        authorizing payment you irrevocably acknowledge that you have read,
        understood (or had a reasonable opportunity to understand), and accepted
        the non-refundable character of the transaction as particularized below.
      </LegalP>

      <LegalSection>
        <LegalH2>1. Governing commercial premise: irreversible digital conveyance</LegalH2>
        <LegalP>
          Unlike tangible goods capable of physical restitution, the Digital
          Goods sold through this storefront consist of informational assets,
          downloadable files, and/or access pathways (including Google Drive
          links and equivalent mechanisms) that, once furnished, place the
          substance of the product beyond the Operator&apos;s continuing
          practical control. Upon successful payment confirmation and issuance
          of access, the Purchaser obtains the full bargained-for benefit.
          Thereafter, the Operator possesses no efficacious means to reclaim,
          remotely delete, neutralize, or otherwise extinguish copies residing
          on the Purchaser&apos;s devices, accounts, or downstream systems.
          Accordingly, the economic value of the sale is deemed fully realized
          at the moment of access provisioning.
        </LegalP>
      </LegalSection>

      <LegalSection>
        <LegalH2>2. Absolute finality; no refunds after access</LegalH2>
        <LegalP>
          ALL SALES ARE FINAL. Except where a mandatory non-waivable consumer
          statute expressly compels otherwise notwithstanding this contractual
          allocation of risk, the Operator shall not issue refunds, partial
          refunds, store credits, exchanges, or goodwill adjustments once
          digital access has been delivered or made available, including without
          limitation where the Purchaser alleges: change of mind; buyer&apos;s
          remorse; insufficient familiarity with digital-goods characteristics;
          dissatisfaction with dataset composition, freshness, niche coverage,
          or formatting; lower-than-expected outreach performance; inability to
          open files due to Purchaser-side software limitations; loss of email
          access; deletion of Drive bookmarks; sharing credentials with third
          parties; or any analogous post-delivery circumstance. Because control
          over the disseminated informational corpus has passed, refund demands
          predicated on continued Operator &quot;possession&quot; of the product
          are commercially and technically inapposite and are hereby rejected.
        </LegalP>
      </LegalSection>

      <LegalSection>
        <LegalH2>3. Pre-delivery payment anomalies</LegalH2>
        <LegalP>
          If, and only if, payment is captured yet the Operator verifiably fails
          to provision any access pathway within a commercially reasonable
          interval solely due to Operator-side fulfillment failure (and not due
          to Purchaser-provided incorrect contact details, spam filtering,
          payment disputes initiated by the Purchaser, or processor delays), the
          Purchaser may notify{" "}
          <a
            href="mailto:support@growscalex.com"
            className="font-medium text-[var(--landing-orange)] hover:underline"
          >
            support@growscalex.com
          </a>{" "}
          for investigation. Remedies in such narrow contingency are limited, at
          the Operator&apos;s election, to completing delivery or refunding the
          sum actually received for the undelivered order. This clause does not
          create a general cooling-off right.
        </LegalP>
      </LegalSection>

      <LegalSection>
        <LegalH2>4. Chargebacks and payment disputes</LegalH2>
        <LegalP>
          Initiating a bank or card chargeback after having received digital
          access constitutes a material breach of these commercial terms and may
          be contested with delivery logs, payment identifiers, and access
          timestamps. The Operator reserves all rights to present evidence to
          processors and to decline future sales to parties who abuse dispute
          mechanisms after successful fulfillment.
        </LegalP>
      </LegalSection>

      <LegalSection>
        <LegalH2>5. No implied warranties of outcomes</LegalH2>
        <LegalP>
          Refund ineligibility is reinforced by the absence of any warranty that
          Digital Goods will produce particular revenue, lead-conversion, or
          engagement metrics. Performance variance is an inherent risk of
          marketing datasets and does not reopen refund eligibility.
        </LegalP>
      </LegalSection>

      <LegalSection>
        <LegalH2>6. Contact for clarifications (not a refund channel of right)</LegalH2>
        <LegalP>
          Questions concerning this Policy may be directed to{" "}
          <a
            href="mailto:support@growscalex.com"
            className="font-medium text-[var(--landing-orange)] hover:underline"
          >
            support@growscalex.com
          </a>{" "}
          or via{" "}
          <a href="/contact" className="font-medium text-[var(--landing-orange)] hover:underline">
            /contact
          </a>
          . Submission of an inquiry does not toll, waive, or create any refund
          entitlement beyond the narrow pre-delivery anomaly described above.
          This Policy may be updated prospectively; the version posted at the
          time of purchase governs that transaction.
        </LegalP>
      </LegalSection>
    </LegalPageShell>
  );
}
