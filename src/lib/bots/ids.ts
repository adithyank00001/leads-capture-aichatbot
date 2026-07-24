function createBotId() {
  const randomPart = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return `bot_${randomPart}`;
}

export { createBotId };
