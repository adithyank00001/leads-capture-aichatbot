import type { BusinessDisplay } from "@/lib/business/display";
import type { WidgetSettings } from "@/lib/widget/types";

/** Set to true in code when you want the landing-page demo section and chat back. */
export const isPublicDemoEnabled = false;

export const demoBusiness: BusinessDisplay = {
  name: "GrowscaleX Demo Agency",
  welcomeMessage: "Enter your details below to try the AI counselor.",
  chatWelcomeMessage:
    "Hi, I'm the AI counselor from GrowscaleX Demo Agency. Looking to study abroad? Tell me what you have in mind — I'll help you explore the best options.",
};

export const demoStarterQuestion =
  "What study abroad options do you have available right now?";

export const demoWidgetSettings: WidgetSettings = {
  botId: "landing-demo",
  headerColor: "#112437",
  accentColor: "#FC7B02",
  launcherHintText: "See How It Captures a Lead",
  launcherHintColor: "#E2E8EF",
  leadFormEnabled: true,
  leadFields: [
    { id: "name", required: true, label: "Name" },
    { id: "phone", required: true, label: "Phone number" },
    { id: "email", required: true, label: "Email" },
  ],
  updatedAt: new Date(0).toISOString(),
};
