"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getProductsByIds } from "@/lib/queries/products";
import { commerceConfig, isStripeConfigured } from "@/lib/config/commerce";
import { getStripe } from "@/lib/stripe";
import { priceCartLines, PricingError } from "@/lib/pricing";
import { createCheckoutSessionSchema } from "@/lib/validations/checkout";
import { enforceRateLimit } from "@/lib/rate-limit";
import { fail, ok, toFieldErrors, type ActionResult } from "@/lib/action-result";

const CHECKOUT_RATE_LIMIT = { limit: 5, windowMs: 60_000 } as const;

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function createCheckoutSession(
  input: unknown,
): Promise<ActionResult<{ url: string }>> {
  const rate = await enforceRateLimit(
    "stripe-checkout",
    CHECKOUT_RATE_LIMIT.limit,
    CHECKOUT_RATE_LIMIT.windowMs,
  );
  if (!rate.ok) {
    return fail("Too many checkout attempts. Please wait and try again.");
  }

  if (!isStripeConfigured()) {
    return fail("Payments are not configured. Contact the store administrator.");
  }

  const parsed = createCheckoutSessionSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Invalid cart.", toFieldErrors(parsed.error));
  }

  const { lines } = parsed.data;

  let priced;
  try {
    const products = await getProductsByIds(lines.map((line) => line.productId));
    priced = priceCartLines(lines, products);
  } catch (error) {
    if (error instanceof PricingError) {
      return fail(error.message);
    }
    return fail("Unable to price your cart. Please try again.");
  }

  const user = await getCurrentUser();
  const stripe = getStripe();

  const lineItems = priced.items.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency: commerceConfig.currency,
      unit_amount: item.unitPriceCents,
      product_data: {
        name: item.title,
        metadata: { productId: item.productId, sku: item.sku },
      },
    },
  }));

  if (commerceConfig.flatShippingCents > 0 && !commerceConfig.stripeTaxEnabled) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: commerceConfig.currency,
        unit_amount: commerceConfig.flatShippingCents,
        product_data: {
          name: "Shipping",
          metadata: { productId: "shipping", sku: "SHIPPING" },
        },
      },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    success_url: `${siteUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl()}/checkout/cancel`,
    customer_email: user?.email,
    ...(commerceConfig.collectShipping
      ? {
          shipping_address_collection: {
            allowed_countries: ["US", "CA", "GB", "AU"],
          },
        }
      : {}),
    ...(commerceConfig.stripeTaxEnabled
      ? { automatic_tax: { enabled: true } }
      : {}),
    metadata: {
      userId: user?.id ?? "",
      lines: JSON.stringify(lines),
      shippingCents: String(commerceConfig.flatShippingCents),
    },
  });

  if (!session.url) {
    return fail("Unable to start checkout. Please try again.");
  }

  return ok({ url: session.url });
}

/** Verify a Stripe session server-side before showing the success page. */
export async function verifyCheckoutSession(
  sessionId: string,
): Promise<ActionResult<{ orderId: string; totalCents: number }>> {
  if (!sessionId) {
    return fail("Missing checkout session.");
  }

  if (!isStripeConfigured()) {
    return fail("Payments are not configured.");
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return fail("Payment has not been completed yet.");
  }

  const { getOrderByStripeSessionId } = await import("@/lib/queries/orders");
  const order = await getOrderByStripeSessionId(sessionId);

  if (!order) {
    return fail(
      "Your payment was received. Order confirmation is processing — refresh shortly.",
    );
  }

  return ok({ orderId: order.id, totalCents: order.totalCents });
}

export async function redirectToCheckout(input: unknown): Promise<void> {
  const result = await createCheckoutSession(input);
  if (!result.success) {
    throw new Error(result.error);
  }
  redirect(result.data.url);
}
