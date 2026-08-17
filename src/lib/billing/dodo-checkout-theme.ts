import type DodoPayments from "dodopayments";

const ORANGE_BUTTON = {
  button_primary: "#FC7B02",
  button_primary_hover: "#E36F02",
  button_text_primary: "#ffffff",
  input_focus_border: "#FC7B02",
} as const;

export const DODO_CHECKOUT_CUSTOMIZATION: DodoPayments.CheckoutSessions.CheckoutSessionCustomization =
  {
    theme: "light",
    theme_config: {
      pay_button_text: "Get lifetime access",
      radius: "14px",
      light: {
        ...ORANGE_BUTTON,
        bg_primary: "#ffffff",
        bg_secondary: "#EEF2F6",
        text_primary: "#112437",
        text_secondary: "#3D4D5C",
        text_placeholder: "#5B6B7C",
        border_primary: "#8B9AAB",
        border_secondary: "#B7C3CF",
      },
      dark: {
        ...ORANGE_BUTTON,
        bg_primary: "#112437",
        bg_secondary: "#1a334d",
        text_primary: "#ffffff",
        text_secondary: "#C5D0DB",
        text_placeholder: "#9AA8B5",
        border_primary: "#6B8499",
        border_secondary: "#3D5A73",
      },
    },
  };
