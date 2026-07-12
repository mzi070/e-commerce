import Stripe from "stripe";

let stripeClient: Stripe | null = null;

/** Lazy Stripe client — build does not require STRIPE_SECRET_KEY. */
export function getStripe(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured.");
    }
    stripeClient = new Stripe(secretKey, { typescript: true });
  }
  return stripeClient;
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }
  return secret;
}
