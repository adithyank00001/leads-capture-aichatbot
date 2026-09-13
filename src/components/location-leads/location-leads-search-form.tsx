"use client";

import { useMemo, useState } from "react";
import { City, Country, State } from "country-state-city";
import { toast } from "sonner";

import { SearchableSelect } from "@/components/location-leads/searchable-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchJsonWithTimeout } from "@/lib/api/fetch-client";
import {
  DEPTH_DROPDOWN_LABEL,
  getDepthCostHelperText,
  MAPS_SEARCH_DEPTHS,
  type MapsSearchDepth,
} from "@/lib/location-leads/constants";

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
  const [depth, setDepth] = useState<MapsSearchDepth>(50);
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

  const cities = useMemo(() => {
    if (!countryCode) {
      return [];
    }
    // Prefer state-scoped cities when the country has states (avoids huge lists).
    if (states.length > 0) {
      if (!stateCode) {
        return [];
      }
      return City.getCitiesOfState(countryCode, stateCode).map((city) => ({
        value: city.name,
        label: city.name,
      }));
    }
    return (City.getCitiesOfCountry(countryCode) ?? []).map((city) => ({
      value: city.name,
      label: city.name,
    }));
  }, [countryCode, stateCode, states.length]);

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
            city: cityName || null,
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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border p-4 md:p-5">
      <div className="space-y-1.5">
        <label htmlFor="maps-keyword" className="text-sm font-medium">
          Keyword <span className="text-destructive">*</span>
        </label>
        <Input
          id="maps-keyword"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Example: dentists, software companies"
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
          onChange={(next) => {
            setStateCode(next);
            setCityName("");
          }}
        />
        <SearchableSelect
          id="maps-city"
          label="City"
          placeholder={
            !countryCode
              ? "Select country first"
              : states.length > 0 && !stateCode
                ? "Select state first (optional city)"
                : "Optional"
          }
          options={cities}
          value={cityName}
          disabled={
            !countryCode || (states.length > 0 && !stateCode)
          }
          onChange={setCityName}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="maps-depth" className="text-sm font-medium">
          {DEPTH_DROPDOWN_LABEL}
        </label>
        <select
          id="maps-depth"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          value={depth}
          onChange={(event) =>
            setDepth(Number(event.target.value) as MapsSearchDepth)
          }
        >
          {MAPS_SEARCH_DEPTHS.map((option) => (
            <option key={option} value={option}>
              {option}
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
    </form>
  );
}
