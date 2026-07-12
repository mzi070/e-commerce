/** Integer-cent money helpers. All prices in the codebase use cents internally. */

/** Multiply unit price (cents) by quantity. */
export function lineTotalCents(unitPriceCents: number, quantity: number): number {
  return unitPriceCents * quantity;
}

/** Sum an array of line totals (cents). */
export function sumCents(amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + amount, 0);
}

/** Parse a dollar display string (admin form) into integer cents. */
export function dollarsToCents(value: string | number): number {
  if (typeof value === "number") {
    return Math.round(value * 100);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }
  const negative = trimmed.startsWith("-");
  const normalized = negative ? trimmed.slice(1) : trimmed;
  const [whole = "0", frac = ""] = normalized.split(".");
  const cents =
    Number(whole) * 100 + Number(frac.padEnd(2, "0").slice(0, 2));
  return negative ? -cents : cents;
}

/** Format integer cents for display (e.g. 2499 → "24.99"). */
export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  const whole = Math.floor(absolute / 100);
  const frac = String(absolute % 100).padStart(2, "0");
  return `${sign}${whole}.${frac}`;
}
