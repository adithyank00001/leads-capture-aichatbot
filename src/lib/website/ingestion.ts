import { createHmac } from "node:crypto";

import { appendWebsiteBuildLog } from "@/lib/db/website-build-log";
import { serverEnv } from "@/lib/env.server";
import { ApiValidationError } from "@/lib/validation/errors";

const HMAC_TTL_SECONDS = 10 * 60;

export type GasIngestionPayload = {
  action: "start" | "continue";
  sourceId: string;
  botId: string;
  websiteUrl: string;
  exp: number;
};

export function signGasIngestionPayload(payload: Omit<GasIngestionPayload, "exp">) {
  if (!serverEnv.gasIngestionHmacSecret) {
    throw new ApiValidationError(
      "INGESTION_NOT_CONFIGURED",
      "Website knowledge ingestion is not configured.",
      500,
    );
  }

  const exp = Math.floor(Date.now() / 1000) + HMAC_TTL_SECONDS;
  const body = JSON.stringify({ ...payload, exp });
  const sig = createHmac("sha256", serverEnv.gasIngestionHmacSecret)
    .update(body)
    .digest("hex");

  return {
    ...payload,
    exp,
    sig,
  };
}

export async function triggerGasIngestionStart(payload: {
  sourceId: string;
  botId: string;
  websiteUrl: string;
}) {
  if (!serverEnv.gasIngestionWebAppUrl) {
    throw new ApiValidationError(
      "INGESTION_NOT_CONFIGURED",
      "Website knowledge ingestion is not configured.",
      500,
    );
  }

  await appendWebsiteBuildLog({
    sourceId: payload.sourceId,
    botId: payload.botId,
    step: "gas_trigger",
    status: "started",
    message: `Calling Google Apps Script at ${serverEnv.gasIngestionWebAppUrl}`,
  });

  const signed = signGasIngestionPayload({
    action: "start",
    ...payload,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(serverEnv.gasIngestionWebAppUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(signed),
      signal: controller.signal,
    });

    const responseText = await response.text();

    await appendWebsiteBuildLog({
      sourceId: payload.sourceId,
      botId: payload.botId,
      step: "gas_trigger",
      status: response.ok ? "http_ok" : "http_error",
      message: `GAS HTTP ${response.status}. Body: ${responseText.slice(0, 500)}`,
    });

    let result: { accepted?: boolean; sourceId?: string; error?: string };

    try {
      result = JSON.parse(responseText) as typeof result;
    } catch {
      throw new ApiValidationError(
        "INGESTION_INVALID_RESPONSE",
        "Ingestion worker returned an invalid response.",
        502,
      );
    }

    if (!response.ok || !result.accepted) {
      await appendWebsiteBuildLog({
        sourceId: payload.sourceId,
        botId: payload.botId,
        step: "gas_trigger",
        status: "rejected",
        message: result.error ?? "GAS did not accept the build.",
      });

      throw new ApiValidationError(
        "INGESTION_START_FAILED",
        result.error ?? "Could not start website knowledge build.",
        502,
      );
    }

    await appendWebsiteBuildLog({
      sourceId: payload.sourceId,
      botId: payload.botId,
      step: "gas_trigger",
      status: "accepted",
      message: "GAS accepted the build. Worker should start within ~1 second.",
    });

    return result;
  } catch (error) {
    if (error instanceof ApiValidationError) {
      throw error;
    }

    const message =
      error instanceof Error && error.name === "AbortError"
        ? "GAS did not respond within 10 seconds."
        : error instanceof Error
          ? error.message
          : "Could not reach the ingestion worker.";

    await appendWebsiteBuildLog({
      sourceId: payload.sourceId,
      botId: payload.botId,
      step: "gas_trigger",
      status: "error",
      message,
    });

    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiValidationError("INGESTION_TIMEOUT", message, 504);
    }

    throw new ApiValidationError("INGESTION_START_FAILED", message, 502);
  } finally {
    clearTimeout(timeout);
  }
}
