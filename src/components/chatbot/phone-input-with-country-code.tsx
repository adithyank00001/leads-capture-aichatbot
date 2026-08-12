"use client";

import { useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  combinePhoneValue,
  getDefaultCountryDialCode,
  parsePhoneValue,
  PHONE_COUNTRIES,
} from "@/lib/widget/phone-countries";

type PhoneInputWithCountryCodeProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

const fieldClassName =
  "h-9 rounded-lg border-2 border-[var(--widget-accent)] bg-white text-sm text-zinc-900 shadow-none focus-visible:border-[var(--widget-accent)] focus-visible:ring-[var(--widget-accent)]/50 disabled:cursor-not-allowed disabled:opacity-50";

export function PhoneInputWithCountryCode({
  value,
  onChange,
  placeholder = "Phone number",
  disabled = false,
  className,
  "aria-label": ariaLabel = "Phone number",
}: PhoneInputWithCountryCodeProps) {
  const defaultDialCode = useMemo(() => getDefaultCountryDialCode(), []);
  const parsedValue = useMemo(
    () => parsePhoneValue(value, defaultDialCode),
    [value, defaultDialCode],
  );
  const [dialCode, setDialCode] = useState(parsedValue.dialCode);
  const [localNumber, setLocalNumber] = useState(parsedValue.localNumber);

  useEffect(() => {
    setDialCode(parsedValue.dialCode);
    setLocalNumber(parsedValue.localNumber);
  }, [parsedValue.dialCode, parsedValue.localNumber]);

  function emitChange(nextDialCode: string, nextLocalNumber: string) {
    onChange(combinePhoneValue(nextDialCode, nextLocalNumber));
  }

  return (
    <div className={cn("flex gap-2", className)}>
      <select
        value={dialCode}
        onChange={(event) => {
          const nextDialCode = event.target.value;
          setDialCode(nextDialCode);
          emitChange(nextDialCode, localNumber);
        }}
        disabled={disabled}
        aria-label="Country code"
        className={cn(
          fieldClassName,
          "w-[7.25rem] shrink-0 px-2 outline-none focus-visible:ring-3",
        )}
      >
        {PHONE_COUNTRIES.map((country) => (
          <option key={`${country.code}-${country.dialCode}`} value={country.dialCode}>
            {country.dialCode} {country.name}
          </option>
        ))}
      </select>
      <Input
        type="tel"
        inputMode="tel"
        value={localNumber}
        onChange={(event) => {
          const nextLocalNumber = event.target.value.replace(/[^\d\s()-]/g, "");
          setLocalNumber(nextLocalNumber);
          emitChange(dialCode, nextLocalNumber);
        }}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="tel-national"
        aria-label={ariaLabel}
        className={cn(fieldClassName, "min-w-0 flex-1 placeholder:text-zinc-500")}
      />
    </div>
  );
}
