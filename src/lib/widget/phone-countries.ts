export type PhoneCountry = {
  code: string;
  name: string;
  dialCode: string;
};

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "IN", name: "India", dialCode: "+91" },
  { code: "US", name: "United States", dialCode: "+1" },
  { code: "GB", name: "United Kingdom", dialCode: "+44" },
  { code: "AE", name: "UAE", dialCode: "+971" },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966" },
  { code: "CA", name: "Canada", dialCode: "+1" },
  { code: "AU", name: "Australia", dialCode: "+61" },
  { code: "SG", name: "Singapore", dialCode: "+65" },
  { code: "MY", name: "Malaysia", dialCode: "+60" },
  { code: "PK", name: "Pakistan", dialCode: "+92" },
  { code: "BD", name: "Bangladesh", dialCode: "+880" },
  { code: "DE", name: "Germany", dialCode: "+49" },
  { code: "FR", name: "France", dialCode: "+33" },
  { code: "IT", name: "Italy", dialCode: "+39" },
  { code: "ES", name: "Spain", dialCode: "+34" },
  { code: "NL", name: "Netherlands", dialCode: "+31" },
  { code: "PH", name: "Philippines", dialCode: "+63" },
  { code: "ID", name: "Indonesia", dialCode: "+62" },
  { code: "NG", name: "Nigeria", dialCode: "+234" },
  { code: "ZA", name: "South Africa", dialCode: "+27" },
  { code: "BR", name: "Brazil", dialCode: "+55" },
  { code: "MX", name: "Mexico", dialCode: "+52" },
  { code: "JP", name: "Japan", dialCode: "+81" },
  { code: "KR", name: "South Korea", dialCode: "+82" },
  { code: "CN", name: "China", dialCode: "+86" },
];

const TIMEZONE_DIAL_CODES: Record<string, string> = {
  "Asia/Kolkata": "+91",
  "Asia/Dubai": "+971",
  "Asia/Riyadh": "+966",
  "Asia/Singapore": "+65",
  "Asia/Kuala_Lumpur": "+60",
  "Asia/Karachi": "+92",
  "Asia/Dhaka": "+880",
  "Europe/London": "+44",
  "Australia/Sydney": "+61",
  "Australia/Melbourne": "+61",
};

export function getDefaultCountryDialCode() {
  if (typeof Intl !== "undefined") {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (timeZone in TIMEZONE_DIAL_CODES) {
      return TIMEZONE_DIAL_CODES[timeZone];
    }

    if (timeZone.startsWith("America/")) {
      return "+1";
    }
  }

  return "+91";
}

export function parsePhoneValue(value: string, defaultDialCode: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return { dialCode: defaultDialCode, localNumber: "" };
  }

  if (trimmed.startsWith("+")) {
    const sortedCountries = [...PHONE_COUNTRIES].sort(
      (left, right) => right.dialCode.length - left.dialCode.length,
    );

    for (const country of sortedCountries) {
      if (trimmed.startsWith(country.dialCode)) {
        return {
          dialCode: country.dialCode,
          localNumber: trimmed
            .slice(country.dialCode.length)
            .replace(/\D/g, ""),
        };
      }
    }
  }

  return {
    dialCode: defaultDialCode,
    localNumber: trimmed.replace(/\D/g, ""),
  };
}

export function combinePhoneValue(dialCode: string, localNumber: string) {
  const digits = localNumber.replace(/\D/g, "").replace(/^0+/, "");

  if (!digits) {
    return "";
  }

  return `${dialCode}${digits}`;
}
