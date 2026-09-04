import { getWhatsAppHref } from "@/lib/marketing/whatsapp";

export type MarketingCtaConfig = {
  label: string;
  href: string;
  showPrice: boolean;
  startCheckout: boolean;
  isWhatsApp: boolean;
};

type MarketingCtaOverrides = {
  label?: string;
  showPrice?: boolean;
};

export function resolveMarketingCta(
  hasLifetimeAccess: boolean,
  overrides: MarketingCtaOverrides = {},
): MarketingCtaConfig {
  if (hasLifetimeAccess) {
    return {
      label: "Dashboard",
      href: "/dashboard",
      showPrice: false,
      startCheckout: false,
      isWhatsApp: false,
    };
  }

  return {
    label: overrides.label ?? "Get Lifetime Access",
    href: getWhatsAppHref(),
    showPrice: overrides.showPrice ?? false,
    startCheckout: false,
    isWhatsApp: true,
  };
}
