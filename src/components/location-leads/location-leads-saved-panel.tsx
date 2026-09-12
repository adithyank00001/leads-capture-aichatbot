"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  LocationLeadsResultsTable,
  type MapsLeadRow,
} from "@/components/location-leads/location-leads-results-table";
import { Button } from "@/components/ui/button";
import { fetchJsonWithTimeout } from "@/lib/api/fetch-client";

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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Saved leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Saved leads also expire 24 hours after their search was created.
            Export before they disappear.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="/api/location-leads/export?saved=1">Export saved CSV</a>
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!loading && !error && leads.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          No saved leads yet.{" "}
          <Link href="/location-leads/search" className="text-primary hover:underline">
            Run a search
          </Link>{" "}
          and tap Save.
        </p>
      ) : null}

      {leads.length > 0 ? (
        <LocationLeadsResultsTable
          leads={leads}
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
