"use client";

import { useMemo, useState } from "react";
import { Country, State } from "country-state-city";
import { toast } from "sonner";

import { SearchableSelect } from "@/components/location-leads/searchable-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchJsonWithTimeout } from "@/lib/api/fetch-client";
import {
  TRIAL_DEPTH_HELPER,
  TRIAL_VISIBLE_LEADS,
} from "@/lib/trial/constants";

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

type TrialSearchFormProps = {
  token: string;
  disabled?: boolean;
  onSearchCreated: (searchId: string) => void;
};

export function TrialSearchForm({
  token,
  disabled = false,
  onSearchCreated,
}: TrialSearchFormProps) {
  const [keyword, setKeyword] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [cityName, setCityName] = useState("");
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
    if (disabled) {
      return;
    }

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
        `/api/trial/${encodeURIComponent(token)}/searches`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keyword: keyword.trim(),
            country: selectedCountry.label,
            countryIso: countryCode,
            state: selectedState?.label ?? null,
            city: cityName.trim() || null,
          }),
          timeoutMs: 45_000,
        },
      );

      if (!response.ok || !body.ok || !body.data?.search?.id) {
        throw new Error(body.error?.message ?? "Could not start trial search.");
      }

      toast.success("Trial search started. Processing…");
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
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Trial</Badge>
          <p className="text-sm text-muted-foreground">{TRIAL_DEPTH_HELPER}</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="trial-keyword" className="text-sm font-medium">
              Keyword <span className="text-destructive">*</span>
            </label>
            <Input
              id="trial-keyword"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Example: dentists, clinics"
              required
              maxLength={700}
              disabled={disabled || submitting}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <SearchableSelect
              id="trial-country"
              label="Country"
              placeholder="Select country"
              options={countries}
              value={countryCode}
              required
              allowClear={false}
              disabled={disabled || submitting}
              onChange={(next) => {
                setCountryCode(next);
                setStateCode("");
                setCityName("");
              }}
            />
            <SearchableSelect
              id="trial-state"
              label="State"
              placeholder={countryCode ? "Optional" : "Select country first"}
              options={states}
              value={stateCode}
              disabled={disabled || submitting || !countryCode || states.length === 0}
              onChange={setStateCode}
            />
            <div className="space-y-1.5">
              <label htmlFor="trial-city" className="text-sm font-medium">
                City{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <Input
                id="trial-city"
                value={cityName}
                onChange={(event) => setCityName(event.target.value)}
                placeholder={
                  countryCode
                    ? "Type the exact city name"
                    : "Select country first"
                }
                disabled={disabled || submitting || !countryCode}
                maxLength={120}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="trial-depth" className="text-sm font-medium">
              How many leads do you want?
            </label>
            <select
              id="trial-depth"
              value={TRIAL_VISIBLE_LEADS}
              disabled
              className="h-8 w-full rounded-lg border border-input bg-muted/40 px-2.5 py-1 text-sm opacity-80"
            >
              <option value={TRIAL_VISIBLE_LEADS}>
                {TRIAL_VISIBLE_LEADS} leads (Trial)
              </option>
            </select>
            <p className="text-xs text-muted-foreground">
              Trial is locked to {TRIAL_VISIBLE_LEADS} leads with phone numbers.
            </p>
          </div>

          <Button type="submit" disabled={disabled || submitting}>
            {submitting ? "Starting…" : "Start trial search"}
          </Button>
        </div>
      </div>
    </form>
  );
}
