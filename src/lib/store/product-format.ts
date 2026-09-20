export function formatMoney(amount: number, symbol: string) {
  const whole = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  const [intPart, decPart] = whole.split(".");
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart
    ? `${symbol}${withCommas}.${decPart}`
    : `${symbol}${withCommas}`;
}

export function formatReviewCount(count: number) {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(count % 1000 === 0 ? 0 : 1)}k+`;
  }
  return `${count}+`;
}
