export const CHAT_RETENTION_DAYS = 30;

export const CHAT_RETENTION_NOTICE =
  `Chat history is kept for ${CHAT_RETENTION_DAYS} days. Leads removed from your list are kept for ${CHAT_RETENTION_DAYS} days, then deleted.`;

export function getChatRetentionCutoffDate(now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - CHAT_RETENTION_DAYS);
  return cutoff;
}
