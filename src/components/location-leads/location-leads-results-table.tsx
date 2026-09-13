"use client";

import { useMemo, useState } from "react";
import { FilterIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  onLeadDeleted?: (leadId: string) => void;
  /** Show permanent delete (for Saved leads page). */
  allowDelete?: boolean;
  emptyMessage?: string;
};

type PatchResponse = {
  ok: boolean;
  data?: { lead: MapsLeadRow };
  error?: { message?: string };
};

type SortOption = "name-asc" | "name-desc";

function hasValue(value: string | null | undefined) {
  return Boolean(value && value.trim());
}

export function LocationLeadsResultsTable({
  leads,
  onLeadUpdated,
  onLeadDeleted,
  allowDelete = false,
  emptyMessage = "No leads found for this search.",
}: LocationLeadsResultsTableProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hasPhone, setHasPhone] = useState(false);
  const [hasWebsite, setHasWebsite] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>("name-asc");

  const filtersApplied =
    query.trim().length > 0 || hasPhone || hasWebsite || savedOnly || sort !== "name-asc";

  const filteredLeads = useMemo(() => {
    const q = query.trim().toLowerCase();

    let next = leads.filter((lead) => {
      if (hasPhone && !hasValue(lead.phone)) {
        return false;
      }
      if (hasWebsite && !hasValue(lead.website)) {
        return false;
      }
      if (savedOnly && !lead.is_saved) {
        return false;
      }
      if (!q) {
        return true;
      }

      const haystack = [
        lead.title,
        lead.category,
        lead.phone,
        lead.address,
        lead.website,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });

    next = [...next].sort((a, b) => {
      const left = (a.title ?? "").toLowerCase();
      const right = (b.title ?? "").toLowerCase();
      if (sort === "name-desc") {
        return right.localeCompare(left);
      }
      return left.localeCompare(right);
    });

    return next;
  }, [leads, query, hasPhone, hasWebsite, savedOnly, sort]);

  function clearFilters() {
    setQuery("");
    setHasPhone(false);
    setHasWebsite(false);
    setSavedOnly(false);
    setSort("name-asc");
  }

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

  async function deleteLead(lead: MapsLeadRow) {
    const confirmed = window.confirm(
      `Delete "${lead.title ?? "this lead"}" permanently?`,
    );
    if (!confirmed) {
      return;
    }

    try {
      const { response, body } = await fetchJsonWithTimeout<{
        ok: boolean;
        error?: { message?: string };
      }>(`/api/location-leads/leads/${lead.id}`, {
        method: "DELETE",
      });

      if (!response.ok || !body.ok) {
        throw new Error(body.error?.message ?? "Could not delete lead.");
      }

      onLeadDeleted?.(lead.id);
      toast.success("Lead deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete lead.",
      );
    }
  }

  if (leads.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium tabular-nums text-foreground">
            {filteredLeads.length}
          </span>{" "}
          of{" "}
          <span className="font-medium tabular-nums text-foreground">
            {leads.length}
          </span>{" "}
          leads
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {filtersApplied ? (
            <span className="text-xs font-medium text-primary">
              Filter applied
            </span>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant={filtersOpen || filtersApplied ? "default" : "outline"}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <FilterIcon className="size-3.5" />
            Filters
          </Button>
        </div>
      </div>

      {filtersOpen ? (
        <div className="space-y-3 rounded-xl border border-border/80 bg-card p-3 shadow-sm md:p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, phone, address, category…"
              aria-label="Search leads"
            />
            <select
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              aria-label="Sort leads"
            >
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
            </select>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={clearFilters}
              disabled={!filtersApplied}
            >
              Clear
            </Button>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={hasPhone}
                onChange={(event) => setHasPhone(event.target.checked)}
                className="size-4 rounded border-input"
              />
              Has phone
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={hasWebsite}
                onChange={(event) => setHasWebsite(event.target.checked)}
                className="size-4 rounded border-input"
              />
              Has website
            </label>
            {!allowDelete ? (
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={savedOnly}
                  onChange={(event) => setSavedOnly(event.target.checked)}
                  className="size-4 rounded border-input"
                />
                Saved only
              </label>
            ) : null}
          </div>
        </div>
      ) : null}

      {filteredLeads.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No leads match these filters.{" "}
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="font-semibold">Business</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold">Phone</TableHead>
                <TableHead className="font-semibold">Address</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
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
                      {allowDelete ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => void deleteLead(lead)}
                        >
                          Delete
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
