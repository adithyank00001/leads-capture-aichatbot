"use client";

import { Button } from "@/components/ui/button";
import { getWhatsAppHref } from "@/lib/marketing/whatsapp";
import {
  TRIAL_OTHER_DETAILS_UNLOCK,
  TRIAL_UNLOCK_GENERATE_MORE,
} from "@/lib/trial/constants";

export type TrialLeadRow = {
  title: string | null;
  category: string | null;
  phone: string;
};

type TrialResultsTableProps = {
  leads: TrialLeadRow[];
};

function BlurredOtherDetails() {
  return (
    <div className="relative min-w-[180px] overflow-hidden rounded-md border border-border/60 bg-secondary/70 px-2.5 py-2.5 md:min-w-[160px] md:px-2 md:py-2">
      <div
        aria-hidden
        className="select-none text-xs leading-snug text-muted-foreground blur-[3px] filter md:text-[11px]"
        style={{ fontFamily: "ui-monospace, monospace" }}
      >
        xk9m2qp·addr·wt7h·site·rating·a8f3·map·cid·snip·b2n4
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-card/55 px-2 text-center">
        <span className="text-xs font-medium leading-snug text-primary md:text-[11px]">
          {TRIAL_OTHER_DETAILS_UNLOCK}
        </span>
      </div>
    </div>
  );
}

export function TrialResultsTable({ leads }: TrialResultsTableProps) {
  if (leads.length === 0) {
    return (
      <p className="text-base text-muted-foreground md:text-sm">
        No trial leads to show yet.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
      <p className="border-b border-border/60 bg-secondary/40 px-3 py-2 text-sm text-muted-foreground md:hidden">
        Swipe the table sideways to see all columns
      </p>
      {/* Only the table slides sideways on mobile — not the whole page */}
      <div className="w-full max-w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
        <table className="w-full min-w-[720px] table-fixed text-left text-base md:min-w-[640px] md:text-sm">
          <thead className="border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
            <tr>
              <th className="w-[28%] px-3 py-3 font-medium md:py-2.5">Title</th>
              <th className="w-[22%] px-3 py-3 font-medium md:py-2.5">
                Category
              </th>
              <th className="w-[22%] px-3 py-3 font-medium md:py-2.5">
                Mobile number
              </th>
              <th className="w-[28%] px-3 py-3 font-medium md:py-2.5">
                Other details
              </th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, index) => (
              <tr
                key={`${lead.phone}-${index}`}
                className="border-b border-border/60 last:border-0"
              >
                <td className="px-3 py-3.5 font-medium leading-snug text-foreground md:truncate md:py-2.5">
                  {lead.title ?? "—"}
                </td>
                <td className="px-3 py-3.5 leading-snug text-muted-foreground md:truncate md:py-2.5">
                  {lead.category ?? "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 font-medium text-foreground md:py-2.5">
                  {lead.phone}
                </td>
                <td className="px-3 py-3.5 md:py-2.5">
                  <BlurredOtherDetails />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border/80 bg-secondary/50 px-3 py-4 text-center md:py-3">
        <Button asChild className="h-11 w-full text-base md:h-8 md:w-auto md:text-sm">
          <a
            href={getWhatsAppHref()}
            target="_blank"
            rel="noopener noreferrer"
          >
            {TRIAL_UNLOCK_GENERATE_MORE}
          </a>
        </Button>
      </div>
    </div>
  );
}
