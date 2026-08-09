import type { BusinessDisplay } from "@/lib/business/display";
import type { WidgetSettings } from "@/lib/widget/types";
import { publicConfig } from "@/lib/config";

export const demoBusiness: BusinessDisplay = {
  name: publicConfig.appName,
  welcomeMessage:
    "Demo only — these details are not saved. Enter your details below to try the assistant.",
  chatWelcomeMessage:
    "Hi! I'm a demo AI sales assistant. Ask me anything about how Leady AI helps capture real estate leads from your website.",
};

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
