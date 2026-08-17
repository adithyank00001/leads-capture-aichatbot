export type MarketingCtaConfig = {
  label: string;
  href: string;
  showPrice: boolean;
  startCheckout: boolean;
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
    };
  }

  return {
    label: overrides.label ?? "Get Lifetime Access",
    href: "/checkout",
    showPrice: overrides.showPrice ?? true,
    startCheckout: true,
  };
}
