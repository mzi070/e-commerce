const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** Format a numeric string or number as USD currency. */
export function formatCurrency(value: string | number): string {
  const numeric = typeof value === "string" ? Number(value) : value;
  return currencyFormatter.format(Number.isFinite(numeric) ? numeric : 0);
}

/** Format an ISO date string (or Date) into a human-readable date/time. */
export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return dateFormatter.format(date);
}
