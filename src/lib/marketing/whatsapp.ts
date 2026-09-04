/** WhatsApp sales contact for landing CTAs (checkout pages stay available for manual links). */

export const WHATSAPP_PHONE_E164 = "918891993882";

export const WHATSAPP_DEFAULT_MESSAGE =
  "Hi, I want to get the lifetime access for GrowScaleX AI counsellor. How do I activate it?";

/** Opens WhatsApp with a pre-filled message. */
export function getWhatsAppHref(message: string = WHATSAPP_DEFAULT_MESSAGE): string {
  const params = new URLSearchParams({ text: message });
  return `https://wa.me/${WHATSAPP_PHONE_E164}?${params.toString()}`;
}
