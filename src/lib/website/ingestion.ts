import { createHmac } from "node:crypto";

import { appendWebsiteBuildLog } from "@/lib/db/website-build-log";
import { serverEnv } from "@/lib/env.server";
import { ApiValidationError } from "@/lib/validation/errors";

const HMAC_TTL_SECONDS = 10 * 60;

export type GasDiscoverPayload = {
  action: "discover";
  sourceId: string;
  botId: string;
  websiteUrl: string;
  exp: number;
  sig?: string;
};

export type GasProcessPagePayload = {
  action: "process_page";
  sourceId: string;
  botId: string;
  websiteUrl: string;
  pageId: string;
  exp: number;
  sig?: string;
};

export type GasFinalizePayload = {
  action: "finalize";
  sourceId: string;
  botId: string;
  websiteUrl: string;
  exp: number;
  sig?: string;
};

type SignableGasPayload =
  | Omit<GasDiscoverPayload, "exp" | "sig">
  | Omit<GasProcessPagePayload, "exp" | "sig">
  | Omit<GasFinalizePayload, "exp" | "sig">;

function buildCanonicalPayload(payload: SignableGasPayload, exp: number) {
  if (payload.action === "process_page") {
    return JSON.stringify({
      action: payload.action,
      sourceId: payload.sourceId,
      botId: payload.botId,
      websiteUrl: payload.websiteUrl,
      pageId: payload.pageId,
      exp,
    });
  }

  return JSON.stringify({
    action: payload.action,
    sourceId: payload.sourceId,
    botId: payload.botId,
    websiteUrl: payload.websiteUrl,
    exp,
  });
}

export function signGasPayload(payload: SignableGasPayload) {
  if (!serverEnv.gasIngestionHmacSecret) {
    throw new ApiValidationError(
      "INGESTION_NOT_CONFIGURED",
      "Website knowledge ingestion is not configured.",
      500,
    );
  }

  const exp = Math.floor(Date.now() / 1000) + HMAC_TTL_SECONDS;
  const sig = createHmac("sha256", serverEnv.gasIngestionHmacSecret)
    .update(buildCanonicalPayload(payload, exp))
    .digest("hex");

  return {
    ...payload,
    exp,
    sig,
  };
}

async function postGasWebApp(
  url: string,
  payload: Record<string, unknown>,
  options: {
    sourceId: string;
    botId: string;
    step: string;
    timeoutMs?: number;
  },
) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 10_000,
  );

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const responseText = await response.text();

    await appendWebsiteBuildLog({
      sourceId: options.sourceId,
      botId: options.botId,
      step: options.step,
      status: response.ok ? "http_ok" : "http_error",
      message: `GAS HTTP ${response.status}. Body: ${responseText.slice(0, 500)}`,
    });

    let result: { accepted?: boolean; ok?: boolean; error?: string };

    try {
      result = JSON.parse(responseText) as typeof result;
    } catch {
      throw new ApiValidationError(
        "INGESTION_INVALID_RESPONSE",
        "Ingestion worker returned an invalid response.",
        502,
      );
    }

    if (!response.ok || (!result.accepted && !result.ok)) {
      await appendWebsiteBuildLog({
        sourceId: options.sourceId,
        botId: options.botId,
        step: options.step,
        status: "rejected",
        message: result.error ?? "GAS did not accept the request.",
      });

      throw new ApiValidationError(
        "INGESTION_START_FAILED",
        result.error ?? "Could not reach the ingestion worker.",
        502,
      );
    }

    return result;
  } catch (error) {
    if (error instanceof ApiValidationError) {
      throw error;
    }

    const message =
      error instanceof Error && error.name === "AbortError"
        ? "GAS did not respond in time."
        : error instanceof Error
          ? error.message
          : "Could not reach the ingestion worker.";

    await appendWebsiteBuildLog({
      sourceId: options.sourceId,
      botId: options.botId,
      step: options.step,
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

export async function triggerGasMasterDiscover(payload: {
  sourceId: string;
  botId: string;
  websiteUrl: string;
}) {
  if (!serverEnv.gasMasterWebAppUrl) {
    throw new ApiValidationError(
      "INGESTION_NOT_CONFIGURED",
      "Website knowledge master worker is not configured.",
      500,
    );
  }

  await appendWebsiteBuildLog({
    sourceId: payload.sourceId,
    botId: payload.botId,
    step: "master_trigger",
    status: "started",
    message: `Calling master worker at ${serverEnv.gasMasterWebAppUrl}`,
  });

  const signed = signGasPayload({
    action: "discover",
    ...payload,
  });

  const result = await postGasWebApp(
    serverEnv.gasMasterWebAppUrl,
    signed,
    {
      sourceId: payload.sourceId,
      botId: payload.botId,
      step: "master_trigger",
      timeoutMs: 180_000,
    },
  );

  await appendWebsiteBuildLog({
    sourceId: payload.sourceId,
    botId: payload.botId,
    step: "master_trigger",
    status: "accepted",
    message: "Master worker accepted the discover request.",
  });

  return result;
}

export async function triggerGasProcessPage(payload: {
  sourceId: string;
  botId: string;
  websiteUrl: string;
  pageId: string;
}) {
  if (!serverEnv.gasIngestionWebAppUrl) {
    throw new ApiValidationError(
      "INGESTION_NOT_CONFIGURED",
      "Website knowledge page worker is not configured.",
      500,
    );
  }

  const signed = signGasPayload({
    action: "process_page",
    ...payload,
  });

  return postGasWebApp(serverEnv.gasIngestionWebAppUrl, signed, {
    sourceId: payload.sourceId,
    botId: payload.botId,
    step: "page_worker_trigger",
    timeoutMs: 120_000,
  });
}

/** @deprecated Use triggerGasMasterDiscover */
export async function triggerGasIngestionStart(payload: {
  sourceId: string;
  botId: string;
  websiteUrl: string;
}) {
  return triggerGasMasterDiscover(payload);
}
