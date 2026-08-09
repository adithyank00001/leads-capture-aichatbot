import "server-only";

import { serverEnv } from "@/lib/env.server";
import { ApiValidationError } from "@/lib/validation/errors";

const FALLBACK_DEMO_PROMPT = `You are a helpful AI sales assistant demo for Leady AI, a product that helps real estate businesses capture leads from website visitors using an AI chatbot.

Answer questions about Leady AI clearly and concisely. You help turn anonymous website visitors into contactable leads by capturing name, phone, and email before chatting.

Key points:
- Leady AI captures visitor details before they leave
- Works 24/7 on the business website
- Sends leads and conversation context to the sales team
- One-time lifetime access pricing model

Keep responses friendly, professional, and under 150 words unless more detail is needed.`;

export function getDemoSystemPrompt(): string {
  const prompt = serverEnv.demoSystemPrompt?.trim();

  if (!prompt) {
    if (process.env.NODE_ENV === "production") {
      throw new ApiValidationError(
        "DEMO_NOT_CONFIGURED",
        "Demo assistant is not configured. Please try again later.",
        503,
      );
    }

    return FALLBACK_DEMO_PROMPT;
  }

  return prompt;
}
