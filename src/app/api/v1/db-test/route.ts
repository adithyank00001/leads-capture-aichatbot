import { apiError, apiSuccess } from "@/lib/api-response";
import { createLead } from "@/lib/db/leads";
import { createMessage, getMessagesBySession } from "@/lib/db/messages";
import { publicConfig } from "@/lib/config";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return apiError(
      "NOT_ALLOWED",
      "Database test route is disabled in production.",
      404,
    );
  }

  const sessionId = `dev-test-${Date.now()}`;

  try {
    const lead = await createLead({
      botId: publicConfig.defaultBotId,
      name: "Dev Test Visitor",
      phone: "+15550001111",
      email: "dev-test@example.com",
      sessionId,
      pageUrl: "http://localhost:3000",
    });

    await createMessage({
      botId: publicConfig.defaultBotId,
      sessionId,
      role: "user",
      content: "Hello from the database test route.",
    });

    await createMessage({
      botId: publicConfig.defaultBotId,
      sessionId,
      role: "assistant",
      content: "Database test reply saved successfully.",
    });

    const messages = await getMessagesBySession(
      publicConfig.defaultBotId,
      sessionId,
    );

    return apiSuccess({
      lead,
      messages,
      message:
        "Test lead and messages were saved and read back from Supabase.",
    });
  } catch (error) {
    return apiError(
      "DATABASE_TEST_FAILED",
      error instanceof Error ? error.message : "Database test failed.",
      500,
    );
  }
}
