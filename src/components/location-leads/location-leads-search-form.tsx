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
  MAPS_SEARCH_DEPTH_MAX,
  MAPS_SEARCH_DEPTH_MIN,
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
  const [depthInput, setDepthInput] = useState(
    String(MAPS_SEARCH_DEPTH_DEFAULT),
  );
  const [submitting, setSubmitting] = useState(false);

  const parsedDepth = Number(depthInput);
  const depth: MapsSearchDepth | null = isMapsSearchDepth(parsedDepth)
    ? parsedDepth
    : null;

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
    if (depth === null) {
      toast.error(
        `Enter a whole number from ${MAPS_SEARCH_DEPTH_MIN} to ${MAPS_SEARCH_DEPTH_MAX}.`,
      );
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
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-border p-4 md:p-5"
    >
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
        <Input
          id="maps-depth"
          type="number"
          inputMode="numeric"
          min={MAPS_SEARCH_DEPTH_MIN}
          max={MAPS_SEARCH_DEPTH_MAX}
          step={1}
          value={depthInput}
          onChange={(event) => setDepthInput(event.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          {depth !== null
            ? getDepthCostHelperText(depth)
            : `Enter a whole number from ${MAPS_SEARCH_DEPTH_MIN} to ${MAPS_SEARCH_DEPTH_MAX}.`}
        </p>
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Starting…" : "Start search"}
      </Button>
    </form>
  );
}
