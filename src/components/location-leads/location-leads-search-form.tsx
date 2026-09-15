"use client";

import { useMemo, useState } from "react";
import { Country, State } from "country-state-city";
import { toast } from "sonner";

import { SearchableSelect } from "@/components/location-leads/searchable-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchJsonWithTimeout } from "@/lib/api/fetch-client";
import {
  DEPTH_INPUT_LABEL,
  getDepthCostHelperText,
  isMapsSearchDepth,
  MAPS_SEARCH_DEPTH_DEFAULT,
  MAPS_SEARCH_DEPTH_OPTIONS,
  type MapsSearchDepth,
} from "@/lib/location-leads/constants";
import { cn } from "@/lib/utils";

type SearchResponse = {
  ok: boolean;
  data?: {
    search: {
      id: string;
      status: string;
    };
  };
  error?: {
    message?: string;
  };
};

type LocationLeadsSearchFormProps = {
  onSearchCreated: (searchId: string) => void;
};

export function LocationLeadsSearchForm({
  onSearchCreated,
}: LocationLeadsSearchFormProps) {
  const [keyword, setKeyword] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [cityName, setCityName] = useState("");
  const [depth, setDepth] = useState<MapsSearchDepth>(MAPS_SEARCH_DEPTH_DEFAULT);
  const [submitting, setSubmitting] = useState(false);

  const countries = useMemo(
    () =>
      Country.getAllCountries().map((country) => ({
        value: country.isoCode,
        label: country.name,
      })),
    [],
  );

  const states = useMemo(() => {
    if (!countryCode) {
      return [];
    }
    return State.getStatesOfCountry(countryCode).map((state) => ({
      value: state.isoCode,
      label: state.name,
    }));
  }, [countryCode]);

  const selectedCountry = countries.find((item) => item.value === countryCode);
  const selectedState = states.find((item) => item.value === stateCode);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!keyword.trim()) {
      toast.error("Enter a keyword.");
      return;
    }
    if (!selectedCountry) {
      toast.error("Select a country.");
      return;
    }
    if (!isMapsSearchDepth(depth)) {
      toast.error("Select how many leads you want.");
      return;
    }

    setSubmitting(true);
    try {
      const { response, body } = await fetchJsonWithTimeout<SearchResponse>(
        "/api/location-leads/searches",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keyword: keyword.trim(),
            country: selectedCountry.label,
            countryIso: countryCode,
            state: selectedState?.label ?? null,
            city: cityName.trim() || null,
            depth,
          }),
          timeoutMs: 45_000,
        },
      );

      if (!response.ok || !body.ok || !body.data?.search?.id) {
        throw new Error(body.error?.message ?? "Could not start search.");
      }

      toast.success("Search started. Processing…");
      window.dispatchEvent(new Event("location-leads-credits-changed"));
      onSearchCreated(body.data.search.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not start search.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm md:p-5">
      <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="maps-keyword" className="text-sm font-medium">
          Keyword <span className="text-destructive">*</span>
        </label>
        <Input
          id="maps-keyword"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Example: dentists, clinics"
          required
          maxLength={700}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SearchableSelect
          id="maps-country"
          label="Country"
          placeholder="Select country"
          options={countries}
          value={countryCode}
          required
          allowClear={false}
          onChange={(next) => {
            setCountryCode(next);
            setStateCode("");
            setCityName("");
          }}
        />
        <SearchableSelect
          id="maps-state"
          label="State"
          placeholder={countryCode ? "Optional" : "Select country first"}
          options={states}
          value={stateCode}
          disabled={!countryCode || states.length === 0}
          onChange={setStateCode}
        />
        <div className="space-y-1.5">
          <label htmlFor="maps-city" className="text-sm font-medium">
            City <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Input
            id="maps-city"
            value={cityName}
            onChange={(event) => setCityName(event.target.value)}
            placeholder={
              countryCode
                ? "Type the exact city name (no spelling mistakes)"
                : "Select country first"
            }
            disabled={!countryCode}
            maxLength={120}
            autoComplete="address-level2"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="maps-depth" className="text-sm font-medium">
          {DEPTH_INPUT_LABEL}
        </label>
        <select
          id="maps-depth"
          value={depth}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (isMapsSearchDepth(next)) {
              setDepth(next);
            }
          }}
          required
          className={cn(
            "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          )}
        >
          {MAPS_SEARCH_DEPTH_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option} leads
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          {getDepthCostHelperText(depth)}
        </p>
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Starting…" : "Start search"}
      </Button>
      </div>
      </div>
    </form>
  );
}
