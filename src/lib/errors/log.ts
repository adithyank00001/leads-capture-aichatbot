export type ErrorCategory =
  | "validation"
  | "rate_limit"
  | "usage_limit"
  | "domain"
  | "ai"
  | "database"
  | "unknown";

type LogServerErrorInput = {
  errorId: string;
  route: string;
  category: ErrorCategory;
  botId?: string;
  sessionId?: string;
  message: string;
};

export function logServerError(input: LogServerErrorInput) {
  console.error(
    JSON.stringify({
      level: "error",
      errorId: input.errorId,
      route: input.route,
      category: input.category,
      botId: input.botId,
      sessionId: input.sessionId,
      message: input.message,
      timestamp: new Date().toISOString(),
    }),
  );
}
