"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { PageHeader } from "@/components/app-shell/page-header";
import { Surface } from "@/components/app-shell/surface";
import {
  LocationLeadsResultsTable,
  type MapsLeadRow,
} from "@/components/location-leads/location-leads-results-table";
import { Button } from "@/components/ui/button";
import { fetchJsonWithTimeout } from "@/lib/api/fetch-client";
import { MAPS_SAVED_LEADS_MAX, SAVED_LEADS_BADGE } from "@/lib/location-leads/constants";

type SavedResponse = {
  ok: boolean;
  data?: { leads: MapsLeadRow[] };
};

export function LocationLeadsSavedPanel() {
  const [leads, setLeads] = useState<MapsLeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { body } = await fetchJsonWithTimeout<SavedResponse>(
          "/api/location-leads/saved",
        );
        if (!cancelled) {
          if (body.ok && body.data) {
            setLeads(body.data.leads);
          } else {
            setError("Could not load saved leads.");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load saved leads.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saved leads"
        description={`${SAVED_LEADS_BADGE} You can keep up to ${MAPS_SAVED_LEADS_MAX.toLocaleString()} saved leads.`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <a href="/api/location-leads/export?saved=1">Export saved CSV</a>
          </Button>
        }
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!loading && !error && leads.length === 0 ? (
        <Surface>
          <p className="text-center text-sm text-muted-foreground">
            No saved leads yet.{" "}
            <Link href="/location-leads/search" className="text-primary hover:underline">
              Run a search
            </Link>{" "}
            and tap Save.
          </p>
        </Surface>
      ) : null}

      {leads.length > 0 ? (
        <LocationLeadsResultsTable
          leads={leads}
          allowDelete
          emptyMessage="No saved leads yet."
          onLeadDeleted={(leadId) => {
            setLeads((prev) => prev.filter((lead) => lead.id !== leadId));
          }}
          onLeadUpdated={(updated) => {
            setLeads((prev) => {
              if (!updated.is_saved) {
                return prev.filter((lead) => lead.id !== updated.id);
              }
              return prev.map((lead) =>
                lead.id === updated.id ? { ...lead, ...updated } : lead,
              );
            });
          }}
        />
      ) : null}
    </div>
  );
}
