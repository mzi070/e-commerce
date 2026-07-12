/**
 * Commerce feature flags. Swipez shipping is opt-in via env vars so the app
 * runs without payment credentials during local development.
 */
export const commerceConfig = {
  /** Flat-rate shipping in cents added at checkout. */
  flatShippingCents: Number(process.env.FLAT_SHIPPING_CENTS ?? "0"),
  /** Collect payer address fields on checkout (physical goods). */
  collectShipping: process.env.SWIPEZ_COLLECT_SHIPPING === "true",
} as const;
