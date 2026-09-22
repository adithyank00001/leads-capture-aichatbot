import { Fraunces, Manrope } from "next/font/google";

/**
 * Store fonts only — primary (headings) + secondary (body).
 * Variable fonts (no weight arrays) — more reliable with Turbopack/Vercel builds.
 * Shared by `/` and `/store/*` so we do not load the same family twice.
 */
export const storeDisplayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-store-display",
  display: "swap",
});

export const storeSansFont = Manrope({
  subsets: ["latin"],
  variable: "--font-store-sans",
  display: "swap",
});

export const storeFontVariables = `${storeDisplayFont.variable} ${storeSansFont.variable}`;
