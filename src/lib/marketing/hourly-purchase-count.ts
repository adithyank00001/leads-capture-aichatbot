const MIN_PURCHASES = 11;
const MAX_PURCHASES = 23;

/** Pseudo-random count between 11–23, stable for the current clock hour. */
export function getHourlyPurchaseCount(date: Date = new Date()): number {
  const hourKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}`;

  let hash = 0;
  for (let i = 0; i < hourKey.length; i++) {
    hash = (hash * 31 + hourKey.charCodeAt(i)) >>> 0;
  }

  const range = MAX_PURCHASES - MIN_PURCHASES + 1;
  return MIN_PURCHASES + (hash % range);
}
