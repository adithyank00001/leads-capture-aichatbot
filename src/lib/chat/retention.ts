export const CHAT_RETENTION_DAYS = 30;

export const CHAT_RETENTION_NOTICE =
  `Chat history is kept for ${CHAT_RETENTION_DAYS} days, then automatically deleted. Lead details (name, phone, email) are never deleted.`;

export function getChatRetentionCutoffDate(now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - CHAT_RETENTION_DAYS);
  return cutoff;
}
