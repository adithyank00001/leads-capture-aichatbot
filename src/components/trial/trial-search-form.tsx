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
            city: null,
          }),
          timeoutMs: 45_000,
        },
      );

      if (!response.ok || !body.ok || !body.data?.search?.id) {
        throw new Error(body.error?.message ?? "Could not start trial search.");
      }

      toast.success("Trial search started. This can take about a minute.");
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
      <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
        <div className="border-b border-border/80 bg-secondary/70 px-4 py-3.5 md:px-5 md:py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="text-sm md:text-xs">Trial</Badge>
            <p className="text-base leading-snug text-muted-foreground md:text-sm">
              {TRIAL_DEPTH_HELPER}
            </p>
          </div>
        </div>

        <div className="space-y-5 p-4 md:space-y-4 md:p-5">
          <div className="space-y-2 md:space-y-1.5">
            <label
              htmlFor="trial-keyword"
              className="text-base font-medium md:text-sm"
            >
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
              className="h-11 text-base md:h-9 md:text-sm"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 md:gap-4">
            <SearchableSelect
              id="trial-country"
              label="Country"
              placeholder="Select country"
              options={countries}
              value={countryCode}
              required
              allowClear={false}
              disabled={disabled || submitting}
              labelClassName="text-base md:text-sm"
              inputClassName="h-11 text-base md:h-9 md:text-sm"
              optionClassName="py-2.5 text-base md:py-1.5 md:text-sm"
              onChange={(next) => {
                setCountryCode(next);
                setStateCode("");
              }}
            />
            <SearchableSelect
              id="trial-state"
              label="State"
              placeholder={countryCode ? "Optional" : "Select country first"}
              options={states}
              value={stateCode}
              disabled={disabled || submitting}
              labelClassName="text-base md:text-sm"
              inputClassName="h-11 text-base md:h-9 md:text-sm"
              optionClassName="py-2.5 text-base md:py-1.5 md:text-sm"
              onChange={(next) => {
                if (!countryCode) {
                  return;
                }
                setStateCode(next);
              }}
            />
            <div className="space-y-2 sm:col-span-2 md:col-span-1 md:space-y-1.5">
              <label
                htmlFor="trial-city"
                className="text-base font-medium md:text-sm"
              >
                City{" "}
                <span className="font-normal text-destructive">
                  (unlock lifetime access to choose city or district)
                </span>
              </label>
              <Input
                id="trial-city"
                value=""
                readOnly
                disabled
                placeholder="locked in trial"
                className="h-11 text-base opacity-80 md:h-9 md:text-sm"
              />
            </div>
          </div>

          <div className="space-y-2 md:space-y-1.5">
            <label
              htmlFor="trial-depth"
              className="text-base font-medium md:text-sm"
            >
              How many leads do you want?
            </label>
            <select
              id="trial-depth"
              value={TRIAL_VISIBLE_LEADS}
              disabled
              className="h-11 w-full rounded-lg border border-input bg-secondary/80 px-3 py-1 text-base text-foreground opacity-90 md:h-9 md:text-sm"
            >
              <option value={TRIAL_VISIBLE_LEADS}>
                {TRIAL_VISIBLE_LEADS} leads (Trial)
              </option>
            </select>
            <p className="text-sm leading-snug text-destructive md:text-xs">
              Trial is locked to {TRIAL_VISIBLE_LEADS} leads with phone numbers.
            </p>
          </div>

          <Button
            type="submit"
            disabled={disabled || submitting}
            className="h-12 w-full text-base md:h-9 md:w-auto md:text-sm"
          >
            {submitting ? "Starting…" : "Start trial search"}
          </Button>
        </div>
      </div>
    </form>
  );
}
