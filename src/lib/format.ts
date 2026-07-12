import { formatCents } from "@/lib/money";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** Format integer cents as USD currency for display. */
export function formatCurrencyFromCents(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

/** Format a legacy dollar string or cents number for display. */
export function formatCurrency(value: string | number): string {
  if (typeof value === "number") {
    return formatCurrencyFromCents(value);
  }
  const numeric = Number(value);
  return currencyFormatter.format(Number.isFinite(numeric) ? numeric : 0);
}

/** Format an ISO date string (or Date) into a human-readable date/time. */
export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return dateFormatter.format(date);
}

export { formatCents };
