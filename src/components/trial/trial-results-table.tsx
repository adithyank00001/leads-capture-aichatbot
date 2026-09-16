"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { TRIAL_OTHER_DETAILS_UNLOCK } from "@/lib/trial/constants";

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
    <div className="relative overflow-hidden rounded-md border border-border/60 bg-muted/30 px-2 py-2">
      <div
        aria-hidden
        className="select-none blur-[3px] filter"
        style={{
          fontFamily: "ui-monospace, monospace",
          fontSize: "11px",
          lineHeight: 1.4,
          color: "var(--muted-foreground)",
        }}
      >
        xk9m2qp·addr·wt7h·site·rating·a8f3·map·cid·snip·b2n4
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/55 px-2 text-center">
        <span className="text-[11px] font-medium text-foreground/90">
          {TRIAL_OTHER_DETAILS_UNLOCK}
        </span>
      </div>
    </div>
  );
}

export function TrialResultsTable({ leads }: TrialResultsTableProps) {
  if (leads.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No trial leads to show yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/80">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b bg-muted/40 text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Title</th>
            <th className="px-3 py-2 font-medium">Category</th>
            <th className="px-3 py-2 font-medium">Mobile number</th>
            <th className="px-3 py-2 font-medium">Other details</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, index) => (
            <tr
              key={`${lead.phone}-${index}`}
              className="border-b last:border-0"
            >
              <td className="px-3 py-2 font-medium text-foreground">
                {lead.title ?? "—"}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {lead.category ?? "—"}
              </td>
              <td className="px-3 py-2 font-medium">{lead.phone}</td>
              <td className="min-w-[180px] px-3 py-2">
                <BlurredOtherDetails />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t bg-muted/20 px-3 py-3 text-center">
        <Button asChild size="sm">
          <Link href="/checkout">Unlock lifetime access</Link>
        </Button>
      </div>
    </div>
  );
}
