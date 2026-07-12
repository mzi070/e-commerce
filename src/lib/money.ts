/** Parse a decimal money string (e.g. "24.99") into integer cents. */
export function parseMoneyToCents(value: string): number {
  const [whole = "0", frac = ""] = value.split(".");
  const normalizedFrac = frac.padEnd(2, "0").slice(0, 2);
  return Number(whole) * 100 + Number(normalizedFrac);
}

/** Format integer cents as a fixed two-decimal money string. */
export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  const whole = Math.floor(absolute / 100);
  const frac = String(absolute % 100).padStart(2, "0");
  return `${sign}${whole}.${frac}`;
}

/** Multiply a unit price string by a quantity without floating-point drift. */
export function multiplyMoney(unitPrice: string, quantity: number): string {
  return formatCents(parseMoneyToCents(unitPrice) * quantity);
}
