export type WebsiteBuildStatus =
  | "idle"
  | "discovering"
  | "processing"
  | "ready"
  | "partial"
  | "failed"
  | null;

export type SetupInput = {
  businessName: string;
  knowledge: {
    description: string;
    location: string;
    services: string;
    pricing_notes: string;
    current_offer: string;
    opening_hours: string;
    contact_method: string;
    extra_notes: string;
  };
  allowedDomains: string[];
  websiteStatus: WebsiteBuildStatus;
  embedCopied: boolean;
  completedPages?: number;
};

export type SetupStep = {
  id: string;
  label: string;
  complete: boolean;
  href: string;
};

export type ChatbotReadinessLabel =
  | "Not ready"
  | "Ready to install"
  | "Setup in progress";

const DEFAULT_BUSINESS_NAME = "My Business";

const KNOWLEDGE_FIELDS = [
  "description",
  "location",
  "services",
  "pricing_notes",
  "current_offer",
  "opening_hours",
  "contact_method",
  "extra_notes",
] as const;

export function hasBusinessInformation(
  businessName: string,
  knowledge: SetupInput["knowledge"],
) {
  const trimmedName = businessName.trim();
  if (trimmedName && trimmedName !== DEFAULT_BUSINESS_NAME) {
    return true;
  }

  return KNOWLEDGE_FIELDS.some((field) => {
    const value = knowledge[field];
    return typeof value === "string" && value.trim().length > 0;
  });
}

export function hasWebsiteDomain(allowedDomains: string[]) {
  return allowedDomains.length > 0;
}

export function hasWebsiteKnowledge(websiteStatus: WebsiteBuildStatus) {
  return websiteStatus === "ready" || websiteStatus === "partial";
}

export function getChatbotReadinessLabel(input: SetupInput): ChatbotReadinessLabel {
  if (!hasWebsiteDomain(input.allowedDomains)) {
    return "Not ready";
  }

  if (
    input.websiteStatus === "discovering" ||
    input.websiteStatus === "processing"
  ) {
    return "Setup in progress";
  }

  return "Ready to install";
}

export function getSetupSteps(input: SetupInput): SetupStep[] {
  return [
    {
      id: "business",
      label: "Business information",
      complete: hasBusinessInformation(input.businessName, input.knowledge),
      href: "/dashboard/settings",
    },
    {
      id: "domain",
      label: "Website domain",
      complete: hasWebsiteDomain(input.allowedDomains),
      href: "/dashboard/settings",
    },
    {
      id: "knowledge",
      label: "Website knowledge",
      complete: hasWebsiteKnowledge(input.websiteStatus),
      href: "/dashboard/website",
    },
    {
      id: "embed",
      label: "Embed code copied",
      complete: input.embedCopied,
      href: "/dashboard/embed",
    },
  ];
}

export function getContinueSetupHref(steps: SetupStep[]) {
  const incomplete = steps.find((step) => !step.complete);
  return incomplete?.href ?? "/dashboard/embed";
}

export function getWebsiteStatusCustomerLabel(status: WebsiteBuildStatus) {
  switch (status) {
    case "discovering":
      return "Finding pages";
    case "processing":
      return "Building knowledge";
    case "ready":
      return "Ready";
    case "partial":
      return "Ready with some failed pages";
    case "failed":
      return "Build failed";
    case "idle":
      return "Not set up";
    default:
      return "Not set up";
  }
}
