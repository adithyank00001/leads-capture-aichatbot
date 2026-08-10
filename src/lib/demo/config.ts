import type { BusinessDisplay } from "@/lib/business/display";
import type { WidgetSettings } from "@/lib/widget/types";

/** Set to true in code when you want the landing-page demo section and chat back. */
export const isPublicDemoEnabled = false;

export const demoBusiness: BusinessDisplay = {
  name: "GrowscaleX Properties",
  welcomeMessage: "Enter your details below to try the assistant.",
  chatWelcomeMessage:
    "Hi, I'm the AI sales assistant from GrowscaleX Demo Properties. Looking for the right property? Tell me what you have in mind — I'll help you narrow down the best options.",
};

export const demoStarterQuestion =
  "What properties do you have available right now?";

export const demoWidgetSettings: WidgetSettings = {
  botId: "landing-demo",
  headerColor: "#112437",
  accentColor: "#FC7B02",
  leadFormEnabled: true,
  leadFields: [
    { id: "name", required: true, label: "Name" },
    { id: "phone", required: true, label: "Phone number" },
    { id: "email", required: true, label: "Email" },
  ],
  updatedAt: new Date(0).toISOString(),
};
