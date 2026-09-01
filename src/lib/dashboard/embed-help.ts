export type EmbedHelpEntry = {
  id: string;
  title: string;
  issue: string;
  action: string;
  support: string;
};

export const embedPasteGuideSteps = [
  "Copy the full script below.",
  "Open your website editor (WordPress, Wix, Shopify, etc.).",
  'Paste it at the bottom of your page, just before </body> (the closing body tag at the end of the page).',
] as const;

export const embedPasteGuideNote =
  "Do not paste inside <head> — the AI counselor works best at the bottom of the page.";

export const embedSupportLine = "Contact the support team.";

export const embedSetupLoadFailed: EmbedHelpEntry = {
  id: "setup_load_failed",
  title: "Could not load your AI Counselor setup",
  issue: "We could not load your AI Counselor setup from our system.",
  action: "Refresh this page. If the script still does not appear below, try again in a few minutes.",
  support: embedSupportLine,
};

export const embedTroubleshootingEntries: EmbedHelpEntry[] = [
  {
    id: "missing_bot_id",
    title: "AI Counselor not showing — missing bot ID",
    issue:
      "Your website script is missing the bot ID (data-bot-id). The AI counselor cannot connect to your business without it.",
    action:
      'Copy the entire script below and paste it before </body> on your website. Replace any old AI counselor script you added before.',
    support: embedSupportLine,
  },
  {
    id: "old_or_incomplete_script",
    title: "AI Counselor not showing — old or incomplete script",
    issue:
      "Your website may be using an old or incomplete copy of the AI counselor script.",
    action:
      'Copy the entire script below, remove any old AI counselor script from your site, and paste the new one before </body>.',
    support: embedSupportLine,
  },
  {
    id: "chatbot_not_visible",
    title: "AI Counselor not showing — other checks",
    issue: "The script may not be saved or published on your website yet.",
    action:
      "Make sure the script is pasted before </body>, save and publish your website, then hard-refresh your browser (Ctrl+Shift+R or Cmd+Shift+R).",
    support: embedSupportLine,
  },
];
