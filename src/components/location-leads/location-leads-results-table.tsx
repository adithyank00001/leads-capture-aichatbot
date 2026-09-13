"use client";

import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchJsonWithTimeout } from "@/lib/api/fetch-client";

export type MapsLeadRow = {
  id: string;
  title: string | null;
  category: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  is_saved: boolean;
};

type LocationLeadsResultsTableProps = {
  leads: MapsLeadRow[];
  onLeadUpdated: (lead: MapsLeadRow) => void;
};

type PatchResponse = {
  ok: boolean;
  data?: { lead: MapsLeadRow };
  error?: { message?: string };
};

export function LocationLeadsResultsTable({
  leads,
  onLeadUpdated,
}: LocationLeadsResultsTableProps) {
  async function toggleSaved(lead: MapsLeadRow) {
    try {
      const { response, body } = await fetchJsonWithTimeout<PatchResponse>(
        `/api/location-leads/leads/${lead.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isSaved: !lead.is_saved }),
        },
      );

      if (!response.ok || !body.ok || !body.data?.lead) {
        throw new Error(body.error?.message ?? "Could not update lead.");
      }

      onLeadUpdated(body.data.lead);
      toast.success(body.data.lead.is_saved ? "Lead saved." : "Lead unsaved.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update lead.",
      );
    }
  }

  if (leads.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        No leads found for this search.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Business</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Address</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium">{lead.title ?? "Untitled"}</p>
                  {lead.website ? (
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Website
                    </a>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>{lead.category ?? "—"}</TableCell>
              <TableCell>{lead.phone ?? "—"}</TableCell>
              <TableCell className="max-w-[220px] truncate">
                {lead.address ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {lead.is_saved ? (
                    <Badge variant="secondary">Saved</Badge>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void toggleSaved(lead)}
                  >
                    {lead.is_saved ? "Unsave" : "Save"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
