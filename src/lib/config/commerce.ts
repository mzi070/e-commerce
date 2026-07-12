/**
 * Commerce feature flags. Stripe Tax and shipping are opt-in via env vars so
 * the app runs without Stripe credentials during local development.
 */
export const commerceConfig = {
  currency: "usd" as const,
  /** Collect shipping address in Stripe Checkout (physical goods). */
  collectShipping: process.env.STRIPE_COLLECT_SHIPPING === "true",
  /** Enable Stripe Tax automatic calculation. Requires Stripe Tax setup. */
  stripeTaxEnabled: process.env.STRIPE_TAX_ENABLED === "true",
  /** Flat-rate shipping in cents when Stripe Tax/shipping rates are disabled. */
  flatShippingCents: Number(process.env.FLAT_SHIPPING_CENTS ?? "0"),
} as const;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
